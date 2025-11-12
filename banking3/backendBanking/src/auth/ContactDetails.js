import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/ContactDetails.css';

const CITIZEN_OPTIONS = [
  { value: 'RI', label: 'Resident Indian' },
  { value: 'NRI', label: 'Non-Resident Indian' },
  { value: 'OCI', label: 'Overseas Citizen of India' }
];

const STATE_OPTIONS = [
  { code: '01', label: 'Jammu and Kashmir' },
  { code: '02', label: 'Himachal Pradesh' },
  { code: '03', label: 'Punjab' },
  { code: '04', label: 'Chandigarh' },
  { code: '05', label: 'Uttarakhand' },
  { code: '06', label: 'Haryana' },
  { code: '07', label: 'Delhi (NCT)' },
  { code: '08', label: 'Rajasthan' },
  { code: '09', label: 'Uttar Pradesh' },
  { code: '10', label: 'Bihar' },
  { code: '11', label: 'Sikkim' },
  { code: '12', label: 'Arunachal Pradesh' },
  { code: '13', label: 'Nagaland' },
  { code: '14', label: 'Manipur' },
  { code: '15', label: 'Mizoram' },
  { code: '16', label: 'Tripura' },
  { code: '17', label: 'Meghalaya' },
  { code: '18', label: 'Assam' },
  { code: '19', label: 'West Bengal' },
  { code: '20', label: 'Jharkhand' },
  { code: '21', label: 'Odisha' },
  { code: '22', label: 'Chhattisgarh' },
  { code: '23', label: 'Madhya Pradesh' },
  { code: '24', label: 'Gujarat' },
  { code: '25', label: 'Daman and Diu' },
  { code: '26', label: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', label: 'Maharashtra' },
  { code: '28', label: 'Andhra Pradesh' },
  { code: '29', label: 'Karnataka' },
  { code: '30', label: 'Goa' },
  { code: '31', label: 'Lakshadweep' },
  { code: '32', label: 'Kerala' },
  { code: '33', label: 'Tamil Nadu' },
  { code: '34', label: 'Puducherry' },
  { code: '35', label: 'Andaman and Nicobar Islands' },
  { code: '36', label: 'Telangana' },
  { code: '37', label: 'Ladakh' }
];


const sanitizeDigits = value => value.replace(/\D/g, '');
const sanitizeMobileInput = value => sanitizeDigits(value).slice(0, 14);
const sanitizePincodeInput = value => sanitizeDigits(value).slice(0, 6);

function Contactdetails({ mobile = '', email = '', citizenFlag = 'RI' }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedCitizenFlag, setSelectedCitizenFlag] = useState(citizenFlag);
  const [personalDtls, setPersonalDtls] = useState({
    mobile: sanitizeMobileInput(String(mobile)),
    email: String(email).trim().slice(0, 80) // Limit to 80 characters
  });
  const [contactDtls, setContactDtls] = useState({
    pAddrLine1: '',
    pAddrLine2: '',
    pAddrLine4: '',
    pState: STATE_OPTIONS[0]?.code ?? '',
    pPincode: '',
    pCountry: 'IN'
  });
  const [correspondenceDtls, setCorrespondenceDtls] = useState({
    cAddrLine1: '',
    cAddrLine2: '',
    cAddrLine4: '',
    cState: '',
    cPostalCode: '',
    cCountry: ''
  });
  const [errors, setErrors] = useState({});
  const shouldShowOverseas = selectedCitizenFlag !== 'RI';

  // Load userId from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
      fetchContactDetails(savedUserId);
    }
  }, []);

  // Fetch contact details from backend
  const fetchContactDetails = async (userId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/registration/contact-details?userId=${userId}`);
      if (response.data) {
        const data = response.data;
        setPersonalDtls({
          mobile: sanitizeMobileInput(String(data.mobile || '')),
          email: String(data.email || '').trim().slice(0, 80) // Limit to 80 characters
        });
        setSelectedCitizenFlag(data.citizenFlag || 'RI');
        setContactDtls({
          pAddrLine1: data.pAddrLine1 || '',
          pAddrLine2: data.pAddrLine2 || '',
          pAddrLine4: data.pAddrLine4 || '',
          pState: data.pState || STATE_OPTIONS[0]?.code || '',
          pPincode: data.pPincode || '',
          pCountry: data.pCountry || 'IN'
        });
        setCorrespondenceDtls({
          cAddrLine1: data.cAddrLine1 || '',
          cAddrLine2: data.cAddrLine2 || '',
          cAddrLine4: data.cAddrLine4 || '',
          cState: data.cState || '',
          cPostalCode: data.cPostalCode || '',
          cCountry: data.cCountry || ''
        });
        // Update localStorage with fetched data
        localStorage.setItem('contactDetails', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
      // If not found, try to load from localStorage
      try {
        const savedContactDetails = localStorage.getItem('contactDetails');
        if (savedContactDetails) {
          const parsedData = JSON.parse(savedContactDetails);
          setPersonalDtls({
            mobile: sanitizeMobileInput(String(parsedData.mobile || '')),
            email: String(parsedData.email || '').trim().slice(0, 80) // Limit to 80 characters
          });
          setSelectedCitizenFlag(parsedData.citizenFlag || 'RI');
          setContactDtls({
            pAddrLine1: parsedData.pAddrLine1 || '',
            pAddrLine2: parsedData.pAddrLine2 || '',
            pAddrLine4: parsedData.pAddrLine4 || '',
            pState: parsedData.pState || STATE_OPTIONS[0]?.code || '',
            pPincode: parsedData.pPincode || '',
            pCountry: parsedData.pCountry || 'IN'
          });
          setCorrespondenceDtls({
            cAddrLine1: parsedData.cAddrLine1 || '',
            cAddrLine2: parsedData.cAddrLine2 || '',
            cAddrLine4: parsedData.cAddrLine4 || '',
            cState: parsedData.cState || '',
            cPostalCode: parsedData.cPostalCode || '',
            cCountry: parsedData.cCountry || ''
          });
        }
      } catch (error) {
        console.error('Error loading contact details from localStorage:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check email duplicate
const checkEmailDuplicate = async (email) => {
    if (!email || email.trim().length === 0) return false;
    
    setIsChecking(true);
    try {
        const response = await api.post('/registration/check-duplicates', { email });
        return response.data.hasErrors && response.data.errors.email;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    } finally {
        setIsChecking(false);
    }
};

  // Check mobile duplicate
const checkMobileDuplicate = async (mobile) => {
    if (!mobile || mobile.trim().length === 0) return false;
    
    setIsChecking(true);
    try {
        const response = await api.post('/registration/check-duplicates', { mobile });
        return response.data.hasErrors && response.data.errors.mobile;
    } catch (error) {
        console.error('Error checking mobile:', error);
        return false;
    } finally {
        setIsChecking(false);
    }
};

  const handleCitizenChange = event => {
    const value = event.target.value;
    setSelectedCitizenFlag(value);
  };


const handlePersonalChange = async event => {
    const { name, value } = event.target;
    
    if (name === 'mobile') {
        const sanitizedMobile = sanitizeMobileInput(value);
        setPersonalDtls(previous => ({ ...previous, mobile: sanitizedMobile }));
        
        // Check for duplicate when mobile number is at least 10 digits
        if (sanitizedMobile.length >= 10) {
            const isDuplicate = await checkMobileDuplicate(sanitizedMobile);
            setMobileError(isDuplicate ? 'This mobile number is already registered.' : '');
        } else {
            setMobileError(''); // Clear error if number is too short
        }
        return;
    }
    
    if (name === 'email') {
        const trimmedEmail = value.trim().slice(0, 80);
        setPersonalDtls(previous => ({ ...previous, email: trimmedEmail }));
        
        // Basic email format check before checking for duplicates
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(trimmedEmail)) {
            const isDuplicate = await checkEmailDuplicate(trimmedEmail);
            setEmailError(isDuplicate ? 'This email address is already registered.' : '');
        } else {
            setEmailError(''); // Clear error if format is invalid
        }
        return;
    }
};

  const handleContactChange = event => {
    const { name, value } = event.target;
    if (name === 'pPincode') {
      setContactDtls(previous => ({ ...previous, [name]: sanitizePincodeInput(value) }));
      return;
    }
    setContactDtls(previous => ({ ...previous, [name]: value }));
  };

  const handleCorrespondenceChange = event => {
    const { name, value } = event.target;
    setCorrespondenceDtls(previous => ({ ...previous, [name]: value }));
  };

  const validate = () => {
    const validationErrors = {};
    
    // Mobile validation: Numeric only, 7-14 digits
    const mobileValue = personalDtls.mobile.trim();
    if (!mobileValue || !/^\d{7,14}$/.test(mobileValue)) {
      validationErrors.mobile = 'Mobile number must be between 7 and 14 digits.';
    }
    
    // Email validation: Valid format, max 80 chars
    const trimmedEmail = personalDtls.email.trim();
    if (!trimmedEmail || trimmedEmail.length > 80 || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
      validationErrors.email = 'Please enter a valid email address (maximum 80 characters).';
    }
    
    // Address Line 1 validation: Mandatory text field
    if (!contactDtls.pAddrLine1.trim()) {
      validationErrors.pAddrLine1 = 'Address Line 1 is required.';
    }
    
    // City/Town validation: Mandatory text field
    if (!contactDtls.pAddrLine4.trim()) {
      validationErrors.pAddrLine4 = 'City/Town is required.';
    }
    
    // State validation: Mandatory dropdown with state codes
    if (!contactDtls.pState || !STATE_OPTIONS.some(state => state.code === contactDtls.pState)) {
      validationErrors.pState = 'Please select a valid state.';
    }
    
    // Pincode validation: Mandatory 6 digits
    if (!contactDtls.pPincode || !/^\d{6}$/.test(contactDtls.pPincode)) {
      validationErrors.pPincode = 'Pincode must be exactly 6 digits.';
    }
    
    // Country validation: Mandatory, default IN (non-editable)
    if (!contactDtls.pCountry || (selectedCitizenFlag !== 'OCI' && contactDtls.pCountry !== 'IN')) {
      validationErrors.pCountry = 'Country must be IN for resident citizens.';
    }
    
    // Validate overseas address if applicable
    if (shouldShowOverseas) {
      if (!correspondenceDtls.cAddrLine1.trim()) {
        validationErrors.cAddrLine1 = 'Address Line 1 is required for overseas address.';
      }
      
      if (!correspondenceDtls.cAddrLine4.trim()) {
        validationErrors.cAddrLine4 = 'City/Town is required for overseas address.';
      }
      
      if (!correspondenceDtls.cState.trim()) {
        validationErrors.cState = 'State is required for overseas address.';
      }
      
      if (!correspondenceDtls.cPostalCode.trim()) {
        validationErrors.cPostalCode = 'Postal Code is required for overseas address.';
      }
      
      if (!correspondenceDtls.cCountry.trim()) {
        validationErrors.cCountry = 'Country is required for overseas address.';
      }
    }
    
    return validationErrors;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    
    // Check duplicates before submission
    const emailDuplicate = await checkEmailDuplicate(personalDtls.email);
    const mobileDuplicate = await checkMobileDuplicate(personalDtls.mobile);
    
    if (emailDuplicate || mobileDuplicate) {
      setEmailError(emailDuplicate ? 'Email already registered' : '');
      setMobileError(mobileDuplicate ? 'Mobile number already registered' : '');
      return;
    }
    
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        mobile: personalDtls.mobile,
        email: personalDtls.email.trim(), // Trim whitespace before sending
        citizenFlag: selectedCitizenFlag,
        pAddrLine1: contactDtls.pAddrLine1.trim(),
        pAddrLine2: contactDtls.pAddrLine2.trim(),
        pAddrLine4: contactDtls.pAddrLine4.trim(),
        pState: contactDtls.pState,
        pPincode: contactDtls.pPincode,
        pCountry: selectedCitizenFlag === 'OCI' ? contactDtls.pCountry.trim().toUpperCase() : 'IN'
      };
      
      // Only include overseas address if applicable
      if (shouldShowOverseas) {
        payload.cAddrLine1 = correspondenceDtls.cAddrLine1.trim();
        payload.cAddrLine2 = correspondenceDtls.cAddrLine2.trim();
        payload.cAddrLine4 = correspondenceDtls.cAddrLine4.trim();
        payload.cState = correspondenceDtls.cState.trim();
        payload.cPostalCode = correspondenceDtls.cPostalCode.trim();
        payload.cCountry = correspondenceDtls.cCountry.trim();
      }
      
      // Log the payload to debug
      console.log('Submitting contact details payload:', payload);
      
      // Save to localStorage
      localStorage.setItem('contactDetails', JSON.stringify(payload));
      
      // Send data to backend
      await api.post(`/registration/contact-details?userId=${userId}`, payload);
      
      // Navigate to bank tax details
      navigate('/bank-tax-details');
    } catch (error) {
      console.error('Error saving contact details:', error);
      if (error.response && error.response.status === 409) {
        const errorMsg = error.response.data;
        if (errorMsg.includes('Email')) {
          setEmailError(errorMsg);
        } else if (errorMsg.includes('Mobile')) {
          setMobileError(errorMsg);
        } else {
          alert(errorMsg);
        }
      } else if (error.response && error.response.status === 400) {
        const errorMsg = error.response.data;
        if (errorMsg.includes('Email address is too long')) {
          setEmailError('Email address is too long. Maximum 80 characters allowed.');
        } else if (errorMsg.includes('Mobile number is too long')) {
          setMobileError('Mobile number is too long. Maximum 14 digits allowed.');
        } else {
          alert(errorMsg);
        }
      } else {
        alert('Error saving contact details. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/personal-details');
  };

  if (isLoading) {
    return (
      <div className="contact-details-wrapper">
        <div className='loading-spinner'>
          <div className='spinner'></div>
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-details-wrapper">
      <form className="contact-details" onSubmit={handleSubmit} noValidate>
        <div className="contact-details__top">
          <h2 className="contact-details__step-heading">Registration (Step 2 of 6)</h2>
          <h1>Contact & Address</h1>
        </div>
        <div className="contact-details__top-row">
          <div className="contact-details__field">
            <label>
              <span className="label-text">Mobile <span className="required-asterisk" aria-hidden="true">*</span></span>
              <input
                name="mobile"
                value={personalDtls.mobile}
                onChange={handlePersonalChange}
                inputMode="numeric"
                maxLength={14}
                className={mobileError ? 'error' : ''}
              />
              {(errors.mobile || mobileError) && <span className="contact-details__error">{errors.mobile || mobileError}</span>}
            </label>
          </div>
          <div className="contact-details__field">
            <label>
              <span className="label-text">Email <span className="required-asterisk" aria-hidden="true">*</span></span>
              <input
                name="email"
                value={personalDtls.email}
                onChange={handlePersonalChange}
                type="email"
                maxLength={80}
                className={emailError ? 'error' : ''}
              />
              {(errors.email || emailError) && <span className="contact-details__error">{errors.email || emailError}</span>}
            </label>
          </div>
          <div className="contact-details__field">
            <label>
              <span className="label-text">Citizen Type</span>
              <select value={selectedCitizenFlag} onChange={handleCitizenChange}>
                {CITIZEN_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      <section>
        <h2>Permanent (Indian) Address</h2>
        <div className="contact-details__group">
          <label>
            <span className="label-text">Address Line 1 <span className="required-asterisk" aria-hidden="true">*</span></span>
            <input 
              name="pAddrLine1" 
              value={contactDtls.pAddrLine1} 
              onChange={handleContactChange} 
              className={errors.pAddrLine1 ? 'error' : ''}
            />
            {errors.pAddrLine1 && <span className="contact-details__error">{errors.pAddrLine1}</span>}
          </label>
          <label>
            Address Line 2
            <input name="pAddrLine2" value={contactDtls.pAddrLine2} onChange={handleContactChange} />
          </label>
          <label>
            <span className="label-text">City/Town <span className="required-asterisk" aria-hidden="true">*</span></span>
            <input 
              name="pAddrLine4" 
              value={contactDtls.pAddrLine4} 
              onChange={handleContactChange} 
              className={errors.pAddrLine4 ? 'error' : ''}
            />
            {errors.pAddrLine4 && <span className="contact-details__error">{errors.pAddrLine4}</span>}
          </label>
          <label>
            <span className="label-text">State <span className="required-asterisk" aria-hidden="true">*</span></span>
            <select 
              name="pState" 
              value={contactDtls.pState} 
              onChange={handleContactChange}
              className={errors.pState ? 'error' : ''}
            >
              <option value="">Select State</option>
              {STATE_OPTIONS.map(state => (
                <option key={state.code} value={state.code}>
                  {state.label}
                </option>
              ))}
            </select>
            {errors.pState && <span className="contact-details__error">{errors.pState}</span>}
          </label>
          <label>
            <span className="label-text">Pincode <span className="required-asterisk" aria-hidden="true">*</span></span>
            <input
              name="pPincode"
              value={contactDtls.pPincode}
              onChange={handleContactChange}
              inputMode="numeric"
              maxLength={6}
              className={errors.pPincode ? 'error' : ''}
            />
            {errors.pPincode && <span className="contact-details__error">{errors.pPincode}</span>}
          </label>
          <label>
            <span className="label-text">Country <span className="required-asterisk" aria-hidden="true">*</span></span>
            <input
              name="pCountry"
              value={contactDtls.pCountry}
              onChange={handleContactChange}
              readOnly={selectedCitizenFlag !== 'OCI'}
              className={errors.pCountry ? 'error' : ''}
            />
            {errors.pCountry && <span className="contact-details__error">{errors.pCountry}</span>}
          </label>
        </div>
      </section>
      {shouldShowOverseas && (
        <section>
          <h2>Correspondence (Overseas) Address</h2>
          <div className="contact-details__group">
            <label>
              <span className="label-text">Address Line 1 <span className="required-asterisk" aria-hidden="true">*</span></span>
              <input 
                name="cAddrLine1" 
                value={correspondenceDtls.cAddrLine1} 
                onChange={handleCorrespondenceChange}
                className={errors.cAddrLine1 ? 'error' : ''}
              />
              {errors.cAddrLine1 && <span className="contact-details__error">{errors.cAddrLine1}</span>}
            </label>
            <label>
              Address Line 2
              <input name="cAddrLine2" value={correspondenceDtls.cAddrLine2} onChange={handleCorrespondenceChange} />
            </label>
            <label>
              <span className="label-text">City/Town <span className="required-asterisk" aria-hidden="true">*</span></span>
              <input 
                name="cAddrLine4" 
                value={correspondenceDtls.cAddrLine4} 
                onChange={handleCorrespondenceChange}
                className={errors.cAddrLine4 ? 'error' : ''}
              />
              {errors.cAddrLine4 && <span className="contact-details__error">{errors.cAddrLine4}</span>}
            </label>
            <label>
              <span className="label-text">State/Province <span className="required-asterisk" aria-hidden="true">*</span></span>
              <input 
                name="cState" 
                value={correspondenceDtls.cState} 
                onChange={handleCorrespondenceChange}
                className={errors.cState ? 'error' : ''}
              />
              {errors.cState && <span className="contact-details__error">{errors.cState}</span>}
            </label>
            <label>
              <span className="label-text">Postal Code <span className="required-asterisk" aria-hidden="true">*</span></span>
              <input 
                name="cPostalCode" 
                value={correspondenceDtls.cPostalCode} 
                onChange={handleCorrespondenceChange}
                className={errors.cPostalCode ? 'error' : ''}
              />
              {errors.cPostalCode && <span className="contact-details__error">{errors.cPostalCode}</span>}
            </label>
            <label>
              <span className="label-text">Country <span className="required-asterisk" aria-hidden="true">*</span></span>
              <input 
                name="cCountry" 
                value={correspondenceDtls.cCountry} 
                onChange={handleCorrespondenceChange}
                className={errors.cCountry ? 'error' : ''}
              />
              {errors.cCountry && <span className="contact-details__error">{errors.cCountry}</span>}
            </label>
          </div>
        </section>
      )}
      <div className="contact-details__footer">
        <button 
          type="button" 
          className="contact-details__back-button contact-details__back-button--footer"
          onClick={handleBack}
        >
          Back
        </button>
        <button type="submit" className="contact-details__next-button" disabled={isSubmitting || isChecking}>
          {isSubmitting ? 'Saving...' : 'Next: Bank Details'}
        </button>
      </div>
      </form>
    </div>
  );
}

export default Contactdetails;