import { research, type ResearchEntry } from './research';

const shared = (id: string): ResearchEntry => {
  const entry = research.find(item => item.id === id)!;
  return { ...entry, id: `troy-${id}`, tools: ['Troy'] };
};

export const troyResearch: ResearchEntry[] = [
  shared('black-scholes'),
  shared('crr'),
  shared('monte-carlo'),
  {
    id: 'troy-heston', method: 'Stochastic volatility', title: 'A Closed-Form Solution for Options with Stochastic Volatility with Applications to Bond and Currency Options',
    authors: 'Steven L. Heston', year: '1993', source: 'https://wwwf.imperial.ac.uk/~ajacquie/IC_Num_Methods/IC_Num_Methods_Docs/Literature/Heston.pdf', access: 'University-hosted paper', tools: ['Troy'],
    summary: 'A stochastic variance process allows volatility to change over time and to correlate with underlying price shocks.',
  },
  {
    id: 'troy-merton', method: 'Jump diffusion', title: 'Option pricing when underlying stock returns are discontinuous',
    authors: 'Robert C. Merton', year: '1976', source: 'https://www.cmat.edu.uy/~mordecki/hk2010/merton76.pdf', access: 'University-hosted paper', tools: ['Troy'],
    summary: 'Combines continuous price fluctuations with sudden jumps, extending the possible behavior of underlying returns.',
  },
  {
    id: 'troy-variance-simulation', method: 'Numerical simulation', title: 'Positive stochastic volatility simulation',
    authors: 'William Halley, Simon J. A. Malham & Anke Wiese', year: '2008', source: 'https://www.macs.hw.ac.uk/~simonm/psdesarxiv.pdf', access: 'Author-hosted manuscript', tools: ['Troy'],
    summary: 'Discusses numerical schemes that address the nonnegative variance constraint in stochastic volatility models.',
  },
];
