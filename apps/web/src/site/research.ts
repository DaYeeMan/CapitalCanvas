export interface ResearchEntry {
  id: string;
  method: string;
  title: string;
  authors: string;
  year: string;
  source: string;
  access: string;
  summary: string;
  tools: readonly string[];
}

// Primary publications and author/institutional sources. These references
// explain foundations used by the tools.
export const research: ResearchEntry[] = [
  {
    id: "black-scholes", method: "Model foundation", title: "The Pricing of Options and Corporate Liabilities",
    authors: "Fischer Black & Myron Scholes", year: "1973", source: "https://doi.org/10.1086/260062", access: "Publisher · access may vary",
    summary: "A foundation for valuing European options through a replicating hedge and a no-arbitrage model.",
    tools: ["Ithaca"],
  },
  {
    id: "crr", method: "Binomial trees", title: "Option pricing: A simplified approach",
    authors: "John C. Cox, Stephen A. Ross & Mark Rubinstein", year: "1979", source: "https://www.sciencedirect.com/science/article/pii/0304405X79900151", access: "Publisher · access may vary",
    summary: "A discrete tree makes option valuation and early-exercise decisions accessible through backward induction.",
    tools: ["Ithaca"],
  },
  {
    id: "crank-nicolson", method: "Finite differences", title: "A practical method for numerical evaluation of solutions of partial differential equations of the heat-conduction type",
    authors: "John Crank & Phyllis Nicolson", year: "1947", source: "https://doi.org/10.1017/S0305004100023197", access: "Publisher · access may vary",
    summary: "A time-stepping method for diffusion equations that provides the basis for many finite-difference pricing schemes.",
    tools: ["Ithaca"],
  },
  {
    id: "monte-carlo", method: "Simulation", title: "Options: A Monte Carlo approach",
    authors: "Phelim P. Boyle", year: "1977", source: "https://www.sciencedirect.com/science/article/abs/pii/0304405X77900058", access: "Publisher · access may vary",
    summary: "Estimate an option value by averaging discounted payoffs from simulated risk-neutral asset paths.",
    tools: ["Ithaca"],
  },
  {
    id: "psor", method: "American exercise constraint", title: "Crank Nicolson American Option — PSOR",
    authors: "Paul Johnson · University of Manchester", year: "Undated teaching notes", source: "https://personalpages.manchester.ac.uk/staff/paul.johnson-2/resources/math60082/notebooks/math60082-Examples-Sheet-7-Crank-Nicolson-American-Option.html", access: "Open teaching notes",
    summary: "Projected successive over-relaxation solves the finite-difference system while enforcing the exercise payoff as a lower bound.",
    tools: ["Ithaca"],
  },
  {
    id: "longstaff-schwartz", method: "American Monte Carlo", title: "Valuing American Options by Simulation: A Simple Least-Squares Approach",
    authors: "Francis A. Longstaff & Eduardo S. Schwartz", year: "2001", source: "https://escholarship.org/uc/item/43n1k4jb", access: "University repository",
    summary: "Least-squares regression estimates continuation values to decide whether an American option should be exercised.",
    tools: ["Ithaca"],
  },
  {
    id: "reiner-rubinstein", method: "Barrier formulas", title: "Breaking Down the Barriers",
    authors: "Eric Reiner & Mark Rubinstein", year: "1991", source: "https://haas.berkeley.edu/faculty/reiner-eric/", access: "Author bibliography · paper links",
    summary: "Analytical pricing relationships for options whose activation depends on touching a barrier.",
    tools: ["Ithaca"],
  },
  {
    id: "brownian-bridge", method: "Continuous barrier monitoring", title: "Advanced Monte Carlo Methods for Barrier and Related Exotic Options",
    authors: "Emmanuel Gobet", year: "2009", source: "https://hal.science/hal-00319947", access: "Author manuscript repository",
    summary: "Brownian-bridge methods account for barrier crossings that sampled path endpoints can miss.",
    tools: ["Ithaca"],
  },
  {
    id: "asian-control-variate", method: "Asian Monte Carlo", title: "A pricing method for options based on average asset values",
    authors: "Angelien G. Z. Kemna & A. C. F. Vorst", year: "1990", source: "https://www.sciencedirect.com/science/article/pii/0378426690900395", access: "Publisher · access may vary",
    summary: "Geometric-average option values provide a useful control variate for simulating arithmetic-average payoffs.",
    tools: ["Ithaca"],
  },
];
