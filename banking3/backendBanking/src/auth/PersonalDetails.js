import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/PersonalDetails.css';

const PersonalDetails = ({ onNext, formData = {}, setFormData = () => {} }) => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({
    defaultValues: formData.personalDtls || {}
  });

  const watchedFatherName = watch('fathersFirstName');
  const watchedMotherName = watch('mothersFirstName');

  const [gender, setGender] = useState(formData.personalDtls?.gender || 'M');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [panError, setPanError] = useState('');
  const [isCheckingPan, setIsCheckingPan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State to track which parent field is being filled
  const [activeParentField, setActiveParentField] = useState(null);

  // Load userId from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
      fetchPersonalDetails(savedUserId);
    }
  }, []);

  // Fetch personal details from backend
  const fetchPersonalDetails = async (userId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/registration/personal-details?userId=${userId}`);
      if (response.data) {
        const data = response.data;
        reset(data); // Reset form with fetched data
        if (data.gender) {
          setGender(data.gender);
        }
        // Set the active parent field based on fetched data
        if (data.fathersFirstName) {
          setActiveParentField('father');
        } else if (data.mothersFirstName) {
          setActiveParentField('mother');
        }
        localStorage.setItem('personalDetails', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching personal details:', error);
      // If not found, try to load from localStorage
      try {
        const savedData = localStorage.getItem('personalDetails');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          reset(parsedData);
          if (parsedData.gender) setGender(parsedData.gender);
          if (parsedData.fathersFirstName) setActiveParentField('father');
          else if (parsedData.mothersFirstName) setActiveParentField('mother');
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle father's name input
  const handleFathersNameChange = (e) => {
    const value = e.target.value;
    setValue('fathersFirstName', value);
    if (value.trim()) {
      setActiveParentField('father');
      // Clear mother's name if it was previously active
      if (activeParentField === 'mother') {
        setValue('mothersFirstName', '');
      }
    } else {
      // If field is cleared, allow both fields to be active
      setActiveParentField(null);
    }
  };

  // Handle mother's name input
  const handleMothersNameChange = (e) => {
    const value = e.target.value;
    setValue('mothersFirstName', value);
    if (value.trim()) {
      setActiveParentField('mother');
      // Clear father's name if it was previously active
      if (activeParentField === 'father') {
        setValue('fathersFirstName', '');
      }
    } else {
      // If field is cleared, allow both fields to be active
      setActiveParentField(null);
    }
  };

  // PAN validation with duplicate check
  const validatePan = async (value) => {
    if (!value) return 'PAN is required';
    const panPattern = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    if (!panPattern.test(value)) return 'Must be 5 letters + 4 digits + 1 letter';
    
    setIsCheckingPan(true);
    try {
      const response = await api.post('/registration/check-duplicates', { pan: value });
      if (response.data.hasErrors && response.data.errors.pan) {
        return 'PAN already registered';
      }
    } catch (error) {
      console.error('Error checking PAN:', error);
    } finally {
      setIsCheckingPan(false);
    }
    return true;
  };

  // Real-time PAN validation
  const handlePanChange = async (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const formatted = value.split('').filter((char, i) => {
      if (i < 5) return /[A-Z]/.test(char);
      if (i < 9) return /\d/.test(char);
      return i === 9 && /[A-Z]/.test(char);
    }).join('');
    
    e.target.value = formatted;
    setValue('pan', formatted, { shouldValidate: true });
    
    if (formatted.length === 10) {
      const error = await validatePan(formatted);
      setPanError(error === true ? '' : error);
    } else {
      setPanError('');
    }
  };

// Update the onSubmit function to better handle PAN errors
const onSubmit = async (data) => {
  // Check if at least one parent name is filled
  if (!data.fathersFirstName?.trim() && !data.mothersFirstName?.trim()) {
    alert('Please fill either Father\'s Name or Mother\'s Name');
    return;
  }

  setIsSubmitting(true);
  setPanError('');
  
  try {
    const stepData = { ...data, gender };
    const panValidationError = await validatePan(data.pan);
    if (panValidationError !== true) {
      setPanError(panValidationError);
      setIsSubmitting(false);
      return;
    }

    if (!userId) {
      localStorage.removeItem('userId');
      localStorage.removeItem('contactDetails');
      localStorage.removeItem('bankTaxDetails');
      localStorage.removeItem('schemeSelection');
      localStorage.removeItem('nomineeDetails');
      localStorage.removeItem('uploadDocuments');
    }

    localStorage.setItem('personalDetails', JSON.stringify(stepData));
    setFormData(prev => ({ ...prev, personalDtls: stepData }));

    const response = await api.post('/registration/personal-details' + (userId ? `?userId=${userId}` : ''), stepData);
    const newUserId = response.data;
    setUserId(newUserId);
    localStorage.setItem('userId', newUserId);

    navigate('/contact-details');
  } catch (e) {
    console.error('Error saving personal details:', e);
    
    // Handle specific database constraint violation for PAN
    if (e.response) {
      const errorMessage = e.response.data;
      
      // Check if it's a PAN duplicate error
      if (e.response.status === 409 || 
          (e.response.status === 400 && errorMessage.includes('PAN')) ||
          (errorMessage && errorMessage.includes('Duplicate entry') && errorMessage.includes('pan'))) {
        setPanError('PAN already registered');
      } else {
        setPanError(errorMessage || 'Error saving personal details. Please try again.');
      }
    } else if (e.message && e.message.includes('Duplicate entry') && e.message.includes('pan')) {
      // Handle case where the error comes from the database directly
      setPanError('PAN already registered');
    } else {
      alert('Error saving personal details. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // Validation rules (simplified for parent names)
  const titleValidation = { required: 'Title is required', validate: value => ['Shri', 'Smt', 'Kum'].includes(value) || 'Please select a valid title' };
  const firstNameOptions = { required: 'First Name is required', pattern: { value: /^[A-Za-z\s]+$/, message: 'Please enter a valid name' }, maxLength: { value: 90, message: 'Maximum 90 characters' } };
  const middleNameOptions = { pattern: { value: /^[A-Za-z\s]*$/, message: 'Please enter a valid name' }, maxLength: { value: 90, message: 'Maximum 90 characters' } };
  const lastNameOptions = { pattern: { value: /^[A-Za-z\s]*$/, message: 'Please enter a valid name' }, maxLength: { value: 90, message: 'Maximum 90 characters' } };
  const genderValidation = { required: 'Gender is required', validate: { validGender: value => ['M', 'F', 'T'].includes(value) || 'Please select a valid gender' } };
  
  // Simplified validation for parent names - main logic is in onSubmit
  const fathersNameOptions = {
    pattern: { value: /^[A-Za-z\s]*$/, message: 'Please enter a valid name' },
    maxLength: { value: 90, message: 'Maximum 90 characters' }
  };
  const mothersNameOptions = {
    pattern: { value: /^[A-Za-z\s]*$/, message: 'Please enter a valid name' },
    maxLength: { value: 90, message: 'Maximum 90 characters' }
  };

  const panValidation = { required: 'PAN is required', validate: validatePan };
  const dobValidation = { required: 'Date of Birth is required', validate: { validDate: (value) => { if (!value) return 'Date of Birth is required'; const [year, month, day] = value.split('-').map(Number); const date = new Date(year, month - 1, day); if (isNaN(date.getTime())) return 'Please enter a valid date'; const today = new Date(); today.setHours(0, 0, 0, 0); if (date > today) return 'Date of birth cannot be in the future'; const minAgeDate = new Date(today); minAgeDate.setFullYear(today.getFullYear() - 18); if (date > minAgeDate) return 'You must be at least 18 years old'; return true; } } };
  const today = new Date().toISOString().split('T')[0];
  
  if (isLoading) {
    return (
      <div className='form-container'>
        <div className='loading-spinner'>
          <div className='spinner'></div>
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className='form-container'>
      <div className='form-header'>
        <h2>Registration (Step 1 of 6)</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className='registration-form'>
        {/* Name Row */}
        <div className='form-row'>
          {/* ... other form fields remain the same ... */}
          <div className='form-group title-group'>
            <label>Title <span className='required'>*</span></label>
            <select className={`form-control ${errors.title ? 'error' : ''}`} {...register('title', titleValidation)}>
              <option value=''>Select Title</option>
              <option value='Shri'>Shri</option>
              <option value='Smt'>Smt</option>
              <option value='Kum'>Kumari</option>
            </select>
            {errors.title && <span className='error-message'>{errors.title.message}</span>}
          </div>
          <div className='form-group'>
            <label>First Name <span className='required'>*</span></label>
            <input type='text' className={`form-control ${errors.firstName ? 'error' : ''}`} {...register('firstName', firstNameOptions)} />
            {errors.firstName && <span className='error-message'>{errors.firstName.message}</span>}
          </div>
          <div className='form-group'>
            <label>Middle Name</label>
            <input type='text' className={`form-control ${errors.middleName ? 'error' : ''}`} {...register('middleName', middleNameOptions)} />
            {errors.middleName && <span className='error-message'>{errors.middleName.message}</span>}
          </div>
          <div className='form-group'>
            <label>Last Name</label>
            <input type='text' className={`form-control ${errors.lastName ? 'error' : ''}`} {...register('lastName', lastNameOptions)} />
            {errors.lastName && <span className='error-message'>{errors.lastName.message}</span>}
          </div>
        </div>

        {/* DOB and Gender */}
        <div className='form-row'>
          <div className='form-group'>
            <label>Date of Birth <span className='required'>*</span></label>
            <input type='date' className={`form-control ${errors.dob ? 'error' : ''}`} max={today} {...register('dob', dobValidation)} />
            {errors.dob && <span className='error-message'>{errors.dob.message}</span>}
          </div>
          <div className='form-group'>
            <label>Gender <span className='required'>*</span></label>
            <select className={`form-control ${errors.gender ? 'error' : ''}`} {...register('gender', genderValidation)} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value=''>Select Gender</option>
              <option value='M'>Male</option>
              <option value='F'>Female</option>
              <option value='T'>TransGender</option>
            </select>
            {errors.gender && <span className='error-message'>{errors.gender.message}</span>}
          </div>
        </div>

        {/* Parents' Names */}
        <div className='form-row'>
          <div className='form-group'>
            <label>Father's First Name</label>
            <input
              type='text'
              className={`form-control ${errors.fathersFirstName ? 'error' : ''}`}
              {...register('fathersFirstName', fathersNameOptions)}
              onChange={handleFathersNameChange}
              disabled={activeParentField === 'mother'}
            />
            {errors.fathersFirstName && <span className='error-message'>{errors.fathersFirstName.message}</span>}
            {activeParentField === 'mother' && <span className="info-message">Please clear Mother's Name to enter Father's Name</span>}
          </div>

          <div className='form-group'>
            <label>Mother's First Name</label>
            <input
              type='text'
              className={`form-control ${errors.mothersFirstName ? 'error' : ''}`}
              {...register('mothersFirstName', mothersNameOptions)}
              onChange={handleMothersNameChange}
              disabled={activeParentField === 'father'}
            />
            {errors.mothersFirstName && <span className='error-message'>{errors.mothersFirstName.message}</span>}
            {activeParentField === 'father' && <span className="info-message">Please clear Father's Name to enter Mother's Name</span>}
          </div>
        </div>

        {/* PAN Row */}
        <div className='form-row'>
          <div className='form-group'>
            <label>PAN Number <span className='required'>*</span></label>
            <div className='pan-input-container'>
              <input
                type='text'
                className={`form-control ${errors.pan || panError ? 'error' : ''}`}
                placeholder='Enter PAN (e.g., ABCDE1234F)'
                onInput={handlePanChange}
                {...register('pan', panValidation)}
                disabled={isCheckingPan}
              />
              {isCheckingPan && <span className="checking-indicator">Checking...</span>}
              {(errors.pan || panError) && <span className='error-message'>{errors.pan?.message || panError}</span>}
              <input type='hidden' value={formData.form60Flag || 'N'} {...register('form60Flag')} />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className='form-actions'>
          <button type='submit' className='btn btn-primary' disabled={isSubmitting || isCheckingPan || panError}>
            {isSubmitting ? 'Creating Registration...' : 'Start Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalDetails;