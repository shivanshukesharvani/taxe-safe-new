/**
 * Mock response data for when Azure services are not configured or unavailable
 * This provides a safe fallback response for testing and development
 */

import { AnalysisResponse } from '../utils/types';

export const mockAnalysisResult: AnalysisResponse = {
  riskLevel: 'MEDIUM',
  summary: 'Based on the provided information, several potential issues were identified. Please review the detected issues carefully.',
  detectedIssues: [
    {
      id: 'i1',
      title: 'Possible Wrong ITR Form Selected',
      short: 'Capital gains detected but ITR-1 selected. ITR-2 or ITR-3 may be required.',
      long: 'You have indicated capital gains in your responses, but ITR-1 was selected. ITR-1 is only for individuals with income from salary, one house property, other sources (interest, etc.), and agricultural income up to Rs. 5,000. If you have capital gains, you should file ITR-2 (if no business income) or ITR-3 (if you have business income). Filing the wrong form can lead to rejection or reassessment.'
    },
    {
      id: 'i2',
      title: 'Missing TDS Information',
      short: 'Form 26AS not uploaded. TDS verification recommended.',
      long: 'Form 26AS contains details of all tax deducted at source (TDS) and tax collected at source (TCS) on your behalf. Without verifying Form 26AS, you may miss claiming TDS credits, leading to overpayment of taxes. Please upload Form 26AS to ensure all TDS is properly accounted for.'
    },
    {
      id: 'i3',
      title: 'Potential HRA Mismatch',
      short: 'HRA claimed but rent receipt details incomplete.',
      long: 'House Rent Allowance (HRA) exemption requires proper documentation including rent receipts and landlord PAN (if annual rent exceeds Rs. 1,00,000). The provided information appears incomplete. Ensure you have valid rent receipts and landlord PAN details before claiming HRA exemption.'
    },
    {
      id: 'i4',
      title: 'Section 80C Limit Check',
      short: 'Total deductions under Section 80C exceed Rs. 1,50,000 limit.',
      long: 'The maximum deduction allowed under Section 80C is Rs. 1,50,000 per financial year. Your total claimed deductions appear to exceed this limit. Please verify that the sum of all Section 80C deductions (ELSS, PPF, NSC, life insurance premium, principal repayment of home loan, etc.) does not exceed Rs. 1,50,000.'
    }
  ]
};

