import type { LeadFormData } from '../types';

export const SAMPLE_PRESETS: Array<{
  name: string;
  data: LeadFormData;
}> = [
  {
    name: 'Hot Lead',
    data: {
      customerName: 'Rahul Sharma',
      phoneNumber: '+91 9876543210',
      email: 'rahul@example.com',
      leadSource: 'Website',
      productInterest: 'CRM Automation',
      budget: '₹1,00,000 - ₹2,00,000',
      customerMessage:
        'We are actively looking for a CRM automation solution for our sales team and want to implement it this month.',
    },
  },
  {
    name: 'Warm Lead',
    data: {
      customerName: 'Priya Mehta',
      phoneNumber: '+91 9123456780',
      email: 'priya@example.com',
      leadSource: 'LinkedIn',
      productInterest: 'Lead Management',
      budget: '₹50,000 - ₹1,00,000',
      customerMessage:
        'We are comparing CRM options and would like to understand pricing and features.',
    },
  },
  {
    name: 'Cold Lead',
    data: {
      customerName: 'Amit Verma',
      phoneNumber: '+91 9000000000',
      email: 'amit@example.com',
      leadSource: 'Referral',
      productInterest: 'CRM',
      budget: 'Not decided',
      customerMessage:
        'Just exploring CRM tools for future use. No immediate requirement.',
    },
  },
];
