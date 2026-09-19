"""Small deterministic CPU MLP with bounded full-batch Adam training."""
from dataclasses import dataclass

import numpy as np

from app.execution import check_execution
from app.delphi.contracts import MLPSettings
from app.delphi.models import NumericalError


def initialize(width: int, seed: int) -> list[np.ndarray]:
    generator = np.random.default_rng(np.random.SeedSequence([seed, 1]))
    parameters = []
    dimensions = (2, width, width, 1)
    for source, destination in zip(dimensions, dimensions[1:]):
        bound = np.sqrt(6 / (source + destination))
        parameters.extend((generator.uniform(-bound, bound, (source, destination)), np.zeros(destination)))
    return parameters


def predict(parameters: list[np.ndarray], coordinates: np.ndarray) -> np.ndarray:
    results = []
    for start in range(0, len(coordinates), 256):
        check_execution()
        hidden = np.tanh(coordinates[start:start + 256] @ parameters[0] + parameters[1])
        hidden = np.tanh(hidden @ parameters[2] + parameters[3])
        results.append((hidden @ parameters[4] + parameters[5]).ravel())
    return np.concatenate(results)


def loss_gradient(parameters: list[np.ndarray], x: np.ndarray, y: np.ndarray, regularization: float) -> tuple[float, list[np.ndarray]]:
    hidden1 = np.tanh(x @ parameters[0] + parameters[1])
    hidden2 = np.tanh(hidden1 @ parameters[2] + parameters[3])
    errors = (hidden2 @ parameters[4] + parameters[5]).ravel() - y
    loss = np.mean(errors**2) + regularization * sum(np.sum(parameters[i]**2) for i in (0, 2, 4))
    output = (2 * errors / len(y))[:, None]
    second = (output @ parameters[4].T) * (1 - hidden2**2)
    first = (second @ parameters[2].T) * (1 - hidden1**2)
    gradients = [x.T @ first, first.sum(axis=0), hidden1.T @ second, second.sum(axis=0), hidden2.T @ output, output.sum(axis=0)]
    for index in (0, 2, 4):
        gradients[index] += 2 * regularization * parameters[index]
    return float(loss), gradients


def adam_step(parameters, gradients, first, second, step: int, learning_rate: float) -> None:
    for index, gradient in enumerate(gradients):
        first[index] = .9 * first[index] + .1 * gradient
        second[index] = .999 * second[index] + .001 * gradient**2
        parameters[index] -= learning_rate * (first[index] / (1 - .9**step)) / (np.sqrt(second[index] / (1 - .999**step)) + 1e-8)


@dataclass
class Network:
    parameters: list[np.ndarray]
    initial_loss: float
    final_loss: float
    epochs: int


def train(x: np.ndarray, y: np.ndarray, settings: MLPSettings, seed: int) -> Network:
    check_execution()
    if x.shape != (len(y), 2) or not 16 <= len(y) <= 256 or not np.all(np.isfinite(x)) or not np.all(np.isfinite(y)):
        raise NumericalError("invalid_training_data", "MLP requires finite shared training rows")
    parameters = initialize(settings.width, seed)
    first = [np.zeros_like(p) for p in parameters]
    second = [np.zeros_like(p) for p in parameters]
    initial, _ = loss_gradient(parameters, x, y, settings.regularization)
    with np.errstate(over="raise", invalid="raise", divide="raise"):
        for step in range(1, settings.epochs + 1):
            check_execution()
            loss, gradients = loss_gradient(parameters, x, y, settings.regularization)
            if not np.isfinite(loss) or any(not np.all(np.isfinite(g)) for g in gradients):
                raise NumericalError("training_diverged", "MLP training diverged; reduce the learning rate")
            adam_step(parameters, gradients, first, second, step, settings.learning_rate)
        final, _ = loss_gradient(parameters, x, y, settings.regularization)
    if not np.isfinite(initial) or not np.isfinite(final):
        raise NumericalError("training_diverged", "MLP loss is not finite")
    return Network(parameters, initial, final, settings.epochs)
