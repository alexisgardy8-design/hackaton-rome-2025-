export interface Project {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  goal: number;
  raised: number;
  deadline: string;
  status: 'active' | 'funded' | 'completed';
  preMoney: number;
  postMoney: number;
  totalSupply: number;
  offeredPercentage: number;
  tokenPrice: number;
  escrowStatus: 'locked' | 'released';
  category: string;
  timeline: {
    date: string;
    event: string;
    status: 'completed' | 'current' | 'upcoming';
  }[];
}

export interface Investment {
  projectId: string;
  projectName: string;
  symbol: string;
  investedAmount: number;
  tokensHeld: number;
  currentValue: number;
  roi: number;
}

export interface Dividend {
  projectId: string;
  projectName: string;
  symbol: string;
  date: string;
  amount: number;
}

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'QuantumLeap AI',
    symbol: '$QLAI',
    description: 'Next-generation machine learning platform for predictive analytics in financial markets.',
    logo: '🚀',
    goal: 500000,
    raised: 425000,
    deadline: '2025-12-15',
    status: 'active',
    preMoney: 2000000,
    postMoney: 2500000,
    totalSupply: 1000000,
    offeredPercentage: 20,
    tokenPrice: 2.5,
    escrowStatus: 'locked',
    category: 'AI/ML',
    timeline: [
      { date: '2025-01-10', event: 'Fundraise Created', status: 'completed' },
      { date: '2025-11-20', event: 'Funding Goal Reached', status: 'current' },
      { date: '2025-12-15', event: 'Dividend Phase Begins', status: 'upcoming' },
    ],
  },
  {
    id: '2',
    name: 'EcoChain Solutions',
    symbol: '$ECOC',
    description: 'Blockchain-based supply chain tracking for sustainable and ethical sourcing.',
    logo: '🌱',
    goal: 300000,
    raised: 300000,
    deadline: '2025-10-30',
    status: 'funded',
    preMoney: 1200000,
    postMoney: 1500000,
    totalSupply: 750000,
    offeredPercentage: 25,
    tokenPrice: 1.6,
    escrowStatus: 'released',
    category: 'Blockchain',
    timeline: [
      { date: '2024-12-01', event: 'Fundraise Created', status: 'completed' },
      { date: '2025-10-15', event: 'Funding Goal Reached', status: 'completed' },
      { date: '2025-10-30', event: 'Dividend Phase Begins', status: 'completed' },
    ],
  },
  {
    id: '3',
    name: 'MedTech Innovations',
    symbol: '$MEDI',
    description: 'Revolutionary telemedicine platform with AI-powered diagnostics and remote monitoring.',
    logo: '⚕️',
    goal: 750000,
    raised: 520000,
    deadline: '2026-01-20',
    status: 'active',
    preMoney: 3000000,
    postMoney: 3750000,
    totalSupply: 1500000,
    offeredPercentage: 20,
    tokenPrice: 2.6,
    escrowStatus: 'locked',
    category: 'HealthTech',
    timeline: [
      { date: '2025-02-01', event: 'Fundraise Created', status: 'completed' },
      { date: '2025-12-20', event: 'Funding Goal Reached', status: 'current' },
      { date: '2026-01-20', event: 'Dividend Phase Begins', status: 'upcoming' },
    ],
  },
  {
    id: '4',
    name: 'DeFi Bridge Protocol',
    symbol: '$DFBP',
    description: 'Cross-chain DeFi protocol enabling seamless asset transfers between XRPL and other networks.',
    logo: '🌉',
    goal: 600000,
    raised: 185000,
    deadline: '2026-02-28',
    status: 'active',
    preMoney: 2500000,
    postMoney: 3100000,
    totalSupply: 1200000,
    offeredPercentage: 19,
    tokenPrice: 2.63,
    escrowStatus: 'locked',
    category: 'DeFi',
    timeline: [
      { date: '2025-03-15', event: 'Fundraise Created', status: 'completed' },
      { date: '2026-01-15', event: 'Funding Goal Reached', status: 'current' },
      { date: '2026-02-28', event: 'Dividend Phase Begins', status: 'upcoming' },
    ],
  },
  {
    id: '5',
    name: 'GreenEnergy Solutions',
    symbol: '$GREN',
    description: 'Solar and wind energy microgrids with blockchain-based energy trading platform.',
    logo: '⚡',
    goal: 900000,
    raised: 900000,
    deadline: '2025-09-01',
    status: 'completed',
    preMoney: 4000000,
    postMoney: 4900000,
    totalSupply: 2000000,
    offeredPercentage: 18,
    tokenPrice: 2.5,
    escrowStatus: 'released',
    category: 'CleanTech',
    timeline: [
      { date: '2024-10-01', event: 'Fundraise Created', status: 'completed' },
      { date: '2025-08-15', event: 'Funding Goal Reached', status: 'completed' },
      { date: '2025-09-01', event: 'Dividend Phase Begins', status: 'completed' },
    ],
  },
];

export const mockInvestments: Investment[] = [
  {
    projectId: '2',
    projectName: 'EcoChain Solutions',
    symbol: '$ECOC',
    investedAmount: 10000,
    tokensHeld: 6250,
    currentValue: 12500,
    roi: 25,
  },
  {
    projectId: '5',
    projectName: 'GreenEnergy Solutions',
    symbol: '$GREN',
    investedAmount: 15000,
    tokensHeld: 6000,
    currentValue: 18000,
    roi: 20,
  },
  {
    projectId: '1',
    projectName: 'QuantumLeap AI',
    symbol: '$QLAI',
    investedAmount: 5000,
    tokensHeld: 2000,
    currentValue: 5200,
    roi: 4,
  },
];

export const mockDividends: Dividend[] = [
  { projectId: '2', projectName: 'EcoChain Solutions', symbol: '$ECOC', date: '2025-11-01', amount: 450 },
  { projectId: '5', projectName: 'GreenEnergy Solutions', symbol: '$GREN', date: '2025-10-15', amount: 680 },
  { projectId: '2', projectName: 'EcoChain Solutions', symbol: '$ECOC', date: '2025-10-01', amount: 420 },
  { projectId: '5', projectName: 'GreenEnergy Solutions', symbol: '$GREN', date: '2025-09-15', amount: 650 },
  { projectId: '5', projectName: 'GreenEnergy Solutions', symbol: '$GREN', date: '2025-08-15', amount: 600 },
  { projectId: '2', projectName: 'EcoChain Solutions', symbol: '$ECOC', date: '2025-09-01', amount: 400 },
];
