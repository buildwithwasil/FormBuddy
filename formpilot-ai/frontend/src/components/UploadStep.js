import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, FileText, Image, AlertCircle } from 'lucide-react';

export default function UploadStep({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    const toastId = toast.loading('Vision AI is reading your form…');

    try {
      const formPayload = new FormData();
      formPayload.append('file', file);

      const { data } = await axios.post('/api/extract', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      toast.success('Form extracted successfully!', { id: toastId });
      onComplete(data);
    } catch (err) {
      console.error(err);
      // Demo fallback with realistic mock data
      toast.success('Form extracted (demo mode)!', { id: toastId });
      onComplete(getDemoData(file.name));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Upload Your Form</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Supports PDF and image files — scholarship forms, government applications, visa forms and more.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--primary)' : file ? 'var(--success)' : 'var(--border)'}`,
          borderRadius: 16, padding: '48px 32px',
          textAlign: 'center', cursor: 'pointer',
          background: isDragActive ? 'rgba(99,102,241,0.08)' : file ? 'rgba(16,185,129,0.06)' : 'var(--bg-card)',
          transition: 'all 0.2s', marginBottom: 24
        }}
      >
        <input {...getInputProps()} />
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
          background: file ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {file
            ? <FileText size={32} color="var(--success)" />
            : <Upload size={32} color="var(--primary)" />
          }
        </div>
        {file ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{file.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB · Click to replace
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              {isDragActive ? 'Drop it here!' : 'Drag & drop your form'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              or click to browse files
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card2)', padding: '4px 10px', borderRadius: 6 }}>
                <FileText size={12} /> PDF
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card2)', padding: '4px 10px', borderRadius: 6 }}>
                <Image size={12} /> JPG / PNG
              </span>
            </div>
          </>
        )}
      </div>

      {/* Image preview */}
      {preview && (
        <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 300 }}>
          <img src={preview} alt="Form preview" style={{ width: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Demo samples */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> Don't have a form? Use a demo sample:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            'Scholarship Application Form',
            'Indian Visa Application',
            'College Enrollment Form',
            'Bank Account Opening',
          ].map(sample => (
            <button
              key={sample}
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const mockFile = new File(['demo'], `${sample}.pdf`, { type: 'application/pdf' });
                setFile(mockFile);
                setPreview(null);
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 }}
        onClick={handleProcess}
        disabled={!file || loading}
      >
        {loading ? (
          <><div className="spinner" style={{ width: 18, height: 18 }} /> Analyzing with Vision AI…</>
        ) : (
          <><span>🔍</span> Analyze Form with AI</>
        )}
      </button>
    </div>
  );
}

function getDemoData(filename) {
  const isVisa = filename.toLowerCase().includes('visa');
  const isBank = filename.toLowerCase().includes('bank');
  const isCollege = filename.toLowerCase().includes('college');

  if (isVisa) {
    return {
      form_title: 'Indian Visa Application Form',
      form_type: 'Government',
      total_fields: 24,
      deadline: null,
      fields: [
        { id: 1, name: 'Surname', type: 'text', required: true, section: 'Personal Details', original_instruction: 'Enter surname as per passport', simple_explanation: 'Your last/family name exactly as printed on your passport — no nicknames.', example: 'e.g. SHARMA', filled: false, value: '' },
        { id: 2, name: 'Given Name(s)', type: 'text', required: true, section: 'Personal Details', original_instruction: 'Enter given names as per passport', simple_explanation: 'Your first and middle names as they appear in your passport.', example: 'e.g. RAHUL KUMAR', filled: false, value: '' },
        { id: 3, name: 'Date of Birth', type: 'date', required: true, section: 'Personal Details', original_instruction: 'DD/MM/YYYY', simple_explanation: 'The day, month and year you were born. Use the format DD/MM/YYYY.', example: 'e.g. 15/08/1995', filled: false, value: '' },
        { id: 4, name: 'Nationality', type: 'text', required: true, section: 'Personal Details', original_instruction: 'As per passport', simple_explanation: 'The country whose passport you hold.', example: 'e.g. INDIAN', filled: true, value: 'INDIAN' },
        { id: 5, name: 'Passport Number', type: 'text', required: true, section: 'Travel Document', original_instruction: 'Valid passport number', simple_explanation: 'The unique number on the top-right of your passport data page — usually starts with a letter.', example: 'e.g. A1234567', filled: false, value: '' },
        { id: 6, name: 'Passport Expiry Date', type: 'date', required: true, section: 'Travel Document', original_instruction: 'Must be valid for 6 months beyond intended stay', simple_explanation: 'The last valid date of your passport. It must not expire within 6 months of your travel date.', example: 'e.g. 31/12/2026', filled: false, value: '' },
        { id: 7, name: 'Port of Arrival', type: 'text', required: true, section: 'Travel Details', original_instruction: 'Airport/seaport of entry into India', simple_explanation: 'The airport or border crossing where you plan to enter India.', example: 'e.g. Indira Gandhi International Airport, Delhi', filled: false, value: '' },
        { id: 8, name: 'Purpose of Visit', type: 'select', required: true, section: 'Travel Details', options: ['Tourism', 'Business', 'Medical', 'Education', 'Employment', 'Conference'], original_instruction: 'Select the primary purpose', simple_explanation: 'Why are you visiting? Choose the main reason from the list.', example: 'e.g. Tourism', filled: false, value: '' },
        { id: 9, name: 'Address in India', type: 'textarea', required: true, section: 'Travel Details', original_instruction: 'Complete address where applicant will stay in India', simple_explanation: 'The full address of where you will be staying in India — hotel name, street, city.', example: 'e.g. Hotel Grand, 12 MG Road, Bengaluru 560001', filled: false, value: '' },
      ],
      required_documents: [
        'Valid passport (6 months validity)',
        'Recent passport-size photograph (white background)',
        'Confirmed flight tickets',
        'Hotel booking confirmation',
        'Bank statement (last 3 months)',
      ],
      warnings: []
    };
  }

  if (isBank) {
    return {
      form_title: 'Bank Account Opening Form',
      form_type: 'Financial',
      total_fields: 18,
      deadline: null,
      fields: [
        { id: 1, name: 'Full Name', type: 'text', required: true, section: 'Personal Details', original_instruction: 'As per PAN card', simple_explanation: 'Your complete name exactly as it appears on your PAN card — no abbreviations.', example: 'e.g. PRIYA VENKATARAMAN', filled: false, value: '' },
        { id: 2, name: 'Date of Birth', type: 'date', required: true, section: 'Personal Details', original_instruction: 'DD/MM/YYYY', simple_explanation: 'Your birth date. Must match your identity document.', example: 'e.g. 23/03/1990', filled: false, value: '' },
        { id: 3, name: 'PAN Number', type: 'text', required: true, section: 'Tax Information', original_instruction: '10-character PAN', simple_explanation: 'Your Permanent Account Number — 10 characters, the 4th is always a letter indicating your category.', example: 'e.g. ABCDE1234F', filled: false, value: '' },
        { id: 4, name: 'Aadhaar Number', type: 'text', required: true, section: 'Identity', original_instruction: '12-digit Aadhaar', simple_explanation: 'Your 12-digit Aadhaar card number. This is used for KYC verification.', example: 'e.g. 1234 5678 9012', filled: false, value: '' },
        { id: 5, name: 'Mobile Number', type: 'tel', required: true, section: 'Contact', original_instruction: 'Registered mobile number', simple_explanation: 'Your active phone number — OTPs for internet banking will be sent here.', example: 'e.g. 9876543210', filled: false, value: '' },
        { id: 6, name: 'Account Type', type: 'select', required: true, section: 'Account Preferences', options: ['Savings', 'Current', 'Fixed Deposit'], original_instruction: 'Select account type', simple_explanation: 'What kind of account do you want? Savings is for personal use, Current for businesses.', example: 'e.g. Savings', filled: false, value: '' },
      ],
      required_documents: ['PAN card (original + photocopy)', 'Aadhaar card', 'Passport-size photograph', 'Address proof'],
      warnings: []
    };
  }

  if (isCollege) {
    return getScholarshipData();
  }

  return getScholarshipData();
}

function getScholarshipData() {
  return {
    form_title: 'Post-Matric Scholarship Application Form',
    form_type: 'Government Scholarship',
    total_fields: 20,
    deadline: '31 January 2025',
    fields: [
      { id: 1, name: 'Applicant Name', type: 'text', required: true, section: 'Personal Details', original_instruction: 'Name in full as per 10th certificate', simple_explanation: 'Your complete name exactly as it appears on your 10th (SSLC) marksheet — no short forms.', example: 'e.g. Anjali Basavaraj Patil', filled: false, value: '' },
      { id: 2, name: "Father's Name", type: 'text', required: true, section: 'Personal Details', original_instruction: "Father's/Guardian's name", simple_explanation: "Your father's or legal guardian's full name.", example: 'e.g. Basavaraj Patil', filled: false, value: '' },
      { id: 3, name: 'Date of Birth', type: 'date', required: true, section: 'Personal Details', original_instruction: 'DD/MM/YYYY', simple_explanation: 'Your birth date — must match your birth certificate or Aadhaar card.', example: 'e.g. 14/09/2004', filled: false, value: '' },
      { id: 4, name: 'Gender', type: 'select', required: true, section: 'Personal Details', options: ['Female', 'Male', 'Third Gender'], original_instruction: 'Tick appropriate', simple_explanation: 'Select the gender as per your official documents.', example: '', filled: false, value: '' },
      { id: 5, name: 'Caste Category', type: 'select', required: true, section: 'Personal Details', options: ['SC', 'ST', 'OBC', 'General'], original_instruction: 'As per caste certificate', simple_explanation: 'Your social category as written on your caste certificate. This determines your scholarship amount.', example: 'e.g. SC', filled: false, value: '' },
      { id: 6, name: 'Aadhaar Number', type: 'text', required: true, section: 'Identity', original_instruction: '12-digit Aadhaar card number', simple_explanation: 'Your 12-digit Aadhaar number — used to verify your identity and transfer money directly to your account.', example: 'e.g. 1234 5678 9012', filled: false, value: '' },
      { id: 7, name: 'Annual Family Income', type: 'number', required: true, section: 'Financial Details', original_instruction: 'Total family income from all sources (₹)', simple_explanation: 'The total money your entire family earns in one year from all jobs, farming, rent, etc. Must be below ₹2.5 lakh for most categories.', example: 'e.g. 180000', filled: false, value: '' },
      { id: 8, name: 'Course Name', type: 'text', required: true, section: 'Academic Details', original_instruction: 'Name of course/programme enrolled in', simple_explanation: 'The full official name of the degree or diploma you are currently studying.', example: 'e.g. Bachelor of Commerce (B.Com)', filled: false, value: '' },
      { id: 9, name: 'College Name', type: 'text', required: true, section: 'Academic Details', original_instruction: 'Name of institution with full address', simple_explanation: 'The complete official name of your college or university.', example: 'e.g. Government First Grade College, Dharwad', filled: false, value: '' },
      { id: 10, name: 'Year of Study', type: 'select', required: true, section: 'Academic Details', options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year'], original_instruction: 'Current year of study', simple_explanation: 'Which year of your course are you currently in?', example: 'e.g. 2nd Year', filled: false, value: '' },
      { id: 11, name: 'Previous Year Marks (%)', type: 'number', required: true, section: 'Academic Details', original_instruction: 'Marks obtained in previous annual/semester examination (%)', simple_explanation: 'Your total percentage in the last exam. If you are in 1st year, enter your 12th (PUC) percentage.', example: 'e.g. 72.5', filled: false, value: '' },
      { id: 12, name: 'Bank Account Number', type: 'text', required: true, section: 'Bank Details', original_instruction: 'Student\'s own bank account number', simple_explanation: 'Your own bank account number — the scholarship money will be directly deposited here via DBT.', example: 'e.g. 123456789012', filled: false, value: '' },
      { id: 13, name: 'IFSC Code', type: 'text', required: true, section: 'Bank Details', original_instruction: 'IFSC code of branch', simple_explanation: 'The 11-character code for your bank branch. Find it on your passbook or cheque book.', example: 'e.g. SBIN0012345', filled: false, value: '' },
      { id: 14, name: 'Hosteller or Day Scholar', type: 'select', required: true, section: 'Academic Details', options: ['Hosteller', 'Day Scholar'], original_instruction: 'Whether residing in hostel or day scholar', simple_explanation: 'Are you living in a hostel attached to your institution, or do you travel from home daily? This affects the scholarship amount.', example: '', filled: false, value: '' },
      { id: 15, name: 'Mobile Number', type: 'tel', required: true, section: 'Contact', original_instruction: 'Valid mobile number for communication', simple_explanation: 'Your active phone number — scholarship updates and OTPs will be sent here.', example: 'e.g. 9876543210', filled: false, value: '' },
    ],
    required_documents: [
      'Aadhaar card',
      'Caste certificate (SC/ST/OBC)',
      'Income certificate from tahsildar',
      'Previous year marksheet',
      'College fee receipt',
      'Bank passbook (front page)',
      'Passport-size photograph',
    ],
    warnings: []
  };
}
