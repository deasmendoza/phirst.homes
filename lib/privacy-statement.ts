// The Sales Career Privacy Statement, as printed on page 2 of the Sellers Accreditation Form
// (the form's own wording, with the spaces its text layer lost put back). The e-mail address is
// the one in the form.

export interface PrivacyPart {
  /** Roman numeral that opens the paragraph. */
  n?: string;
  text: string;
  /** Lettered points under the paragraph. */
  points?: string[];
}

export const PRIVACY_TITLE = 'PHIRST PARK HOMES · SALES CAREER PRIVACY STATEMENT';

export const PRIVACY_STATEMENT: PrivacyPart[] = [
  {
    n: 'I.',
    text: 'This Privacy Policy governs the collection, use and other forms of processing of personal information of the candidates submitting Job Applications/Sales Partnership to PHirst Park Homes (“PPH”). PHirst Park Homes is part of the Century Properties Group Inc. (“CPGI”). PPH is committed to respecting and safeguarding your privacy and the security of your personal information you share with us.',
  },
  {
    n: 'II.',
    text: 'When you choose to register or otherwise contact us, we will ask for some personal data about you such as your name, address, country of residence, resume and e-mail address. This information enables PPH to:',
    points: ['a) Communicate with you regarding your job applications /sales partnership process;', 'b) Communicate with you to inform you about our other new position matching your profile.'],
  },
  { n: 'III.', text: 'PHirst Park Homes may share your personal data internally – within the Century Properties Group’s Human Resources Department and hiring department.' },
  { text: 'PHirst Park Homes may also share your personal data with third party service providers or agents to perform certain processing activities on behalf of PPH. PPH will not sell, rent, lease, or provide your personal data to third parties. PPH requires these service providers to protect your personal data diligently.' },
  { text: 'We will only release your personal information if so required by law, where necessary for preventing or combating fraud, where necessary for dispute resolution or for any other pressing legitimate need in which under the circumstances must outweigh your privacy interests such as the security of our business and the safety of our staff.' },
  { n: 'IV.', text: 'PHirst Park Homes will take appropriate technical and organizational security measures against loss or unlawful processing of this data. This may include using secure registration forms, encryption of data, and restricting access to your personal information.' },
  { n: 'V.', text: 'We will retain your personal data for five (5) years from the date of your application.' },
  { text: 'If you do not want to retain your personal data, send an email to phirstcareers@phirstparkhomes.com – clearly state your name, address, and the request to delete your personal information with regards to job application/sales partnership. We will then delete your data without undue delay. We reserve the right to exercise reasonable measures to verify the identity of the sender of the request, before we delete the requested information.' },
  { text: 'We will only retain personal data related to your account to comply with our legal obligations, resolve disputes, and enforce our agreements.' },
  { n: 'VI.', text: 'This specific privacy policy for job application/sales partnership applies together with other Terms of Use, Privacy Policies, and similar documents applicable to the communication channel you are using. In case of conflict, the clause in more specific document prevails.' },
  { n: 'VII.', text: 'We may change this Privacy Policy from time to time. We therefore encourage you to refer to this policy on an ongoing basis.' },
  { n: 'VII.', text: 'Please send us your questions and comments about privacy to phirstcareers@phirstparkhomes.com.' },
];
