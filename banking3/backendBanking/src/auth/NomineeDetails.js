import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/NomineeDetails.css';

export default function NomineeDetails() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [nominees, setNominees] = useState([
    {
      id: 1,
      firstName: '',
      lastName: '',
      relationship: 'Spouse',
      dateOfBirth: '',
      percentageShare: 100,
      minorNomineeFlag: 'N',
      guardianDetails: { name: '', relationship: '' },
    },
  ]);

  const [currentNomineeIndex, setCurrentNomineeIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [showMaxPopup, setShowMaxPopup] = useState(false);
  const [showShareErrorPopup, setShowShareErrorPopup] = useState(false);
  const [showRequiredFieldsPopup, setShowRequiredFieldsPopup] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // Load userId from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
      fetchNomineeDetails(savedUserId);
    }
  }, []);

  // Fetch nominee details from backend
  const fetchNomineeDetails = async (userId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/registration/nominee-details?userId=${userId}`);
      if (response.data && response.data.nominees && response.data.nominees.length > 0) {
        setNominees(response.data.nominees);
        // Update localStorage with fetched data
        localStorage.setItem('nomineeDetails', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error fetching nominee details:', error);
      // If not found, try to load from localStorage
      try {
        const savedNomineeDetails = localStorage.getItem('nomineeDetails');
        if (savedNomineeDetails) {
          const parsedData = JSON.parse(savedNomineeDetails);
          if (parsedData.nominees && parsedData.nominees.length > 0) {
            setNominees(parsedData.nominees);
          }
        }
      } catch (error) {
        console.error('Error loading nominee details from localStorage:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a nominee is a minor
  const checkIfMinor = (dateOfBirth) => {
    if (!dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  };

  // Handle field input
  const handleInputChange = (index, field, value) => {
    const updated = [...nominees];

    if (field === 'dateOfBirth') {
      const isMinor = checkIfMinor(value);
      updated[index].minorNomineeFlag = isMinor ? 'Y' : 'N';
      if (!isMinor) {
        updated[index].guardianDetails = { name: '', relationship: '' };
      }
    }

    if (field.startsWith('guardian.')) {
      const guardianField = field.split('.')[1];
      updated[index].guardianDetails[guardianField] = value;
    } else {
      updated[index][field] = value;
    }

    setNominees(updated);
    setErrors({ ...errors, [index]: null });
  };

  // Calculate total percentage share
  const calculateTotalShare = () =>
    nominees.reduce((sum, n) => sum + (parseFloat(n.percentageShare) || 0), 0);

  // Add nominee — limited to 3 max
  const handleAddNominee = () => {
    if (nominees.length >= 3) {
      setShowMaxPopup(true);
      return;
    }

    const existingIds = nominees.map((n) => n.id);
    const availableIds = [1, 2, 3];
    const newId = availableIds.find((id) => !existingIds.includes(id));

    const newNominee = {
      id: newId,
      firstName: '',
      lastName: '',
      relationship: 'Spouse',
      dateOfBirth: '',
      percentageShare: 0,
      minorNomineeFlag: 'N',
      guardianDetails: { name: '', relationship: '' },
    };

    const updated = [...nominees, newNominee].sort((a, b) => a.id - b.id);
    setNominees(updated);
    setCurrentNomineeIndex(updated.findIndex((n) => n.id === newId));
  };

  // Remove nominee
  const handleRemoveNominee = () => {
    if (nominees.length <= 1) return;

    const updated = nominees.filter((_, idx) => idx !== currentNomineeIndex);
    const newIndex = currentNomineeIndex >= updated.length ? updated.length - 1 : currentNomineeIndex;

    setNominees(updated);
    setCurrentNomineeIndex(newIndex);
  };

  const handleSwitchNominee = (index) => setCurrentNomineeIndex(index);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    const missing = [];

    nominees.forEach((nominee, index) => {
      if (!nominee.firstName.trim()) {
        newErrors[index] = 'First Name is required';
        missing.push(`First Name for Nominee ${nominee.id}`);
        isValid = false;
      }
      if (!nominee.relationship.trim()) {
        newErrors[index] = 'Relationship is required';
        missing.push(`Relationship for Nominee ${nominee.id}`);
        isValid = false;
      }
      if (nominee.percentageShare === '' || nominee.percentageShare === null || isNaN(nominee.percentageShare)) {
        newErrors[index] = 'Percentage share is required';
        missing.push(`Percentage Share for Nominee ${nominee.id}`);
        isValid = false;
      }
      if (nominee.minorNomineeFlag === 'Y') {
        if (!nominee.guardianDetails.name.trim()) {
          newErrors[index] = 'Guardian name is required for minor nominee';
          missing.push(`Guardian Name for Nominee ${nominee.id}`);
          isValid = false;
        }
        if (!nominee.guardianDetails.relationship) {
          newErrors[index] = 'Guardian relationship is required for minor nominee';
          missing.push(`Guardian Relationship for Nominee ${nominee.id}`);
          isValid = false;
        }
      }
    });

    const total = calculateTotalShare();
    if (total !== 100) {
      newErrors.share = `Total share must be exactly 100% (current: ${total}%)`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = async () => {
    const missing = [];
    let isValid = true;

    nominees.forEach((nominee, index) => {
      if (!nominee.firstName.trim()) {
        missing.push(`First Name for Nominee ${nominee.id}`);
        isValid = false;
      }
      if (!nominee.relationship.trim()) {
        missing.push(`Relationship for Nominee ${nominee.id}`);
        isValid = false;
      }
      if (nominee.percentageShare === '' || nominee.percentageShare === null || isNaN(nominee.percentageShare)) {
        missing.push(`Percentage Share for Nominee ${nominee.id}`);
        isValid = false;
      }
      if (nominee.minorNomineeFlag === 'Y') {
        if (!nominee.guardianDetails.name.trim()) {
          missing.push(`Guardian Name for Nominee ${nominee.id}`);
          isValid = false;
        }
        if (!nominee.guardianDetails.relationship) {
          missing.push(`Guardian Relationship for Nominee ${nominee.id}`);
          isValid = false;
        }
      }
    });

    if (!isValid) {
      setMissingFields(missing);
      setShowRequiredFieldsPopup(true);
      return;
    }

    const total = calculateTotalShare();
    if (total !== 100) {
      setShowShareErrorPopup(true);
      return;
    }

    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Save to localStorage
        localStorage.setItem('nomineeDetails', JSON.stringify({ nominees }));
        
        // Prepare data for backend
        const nomineeData = {
          nominees: nominees.map(n => ({
            id: n.id,
            firstName: n.firstName,
            lastName: n.lastName,
            relationship: n.relationship,
            dateOfBirth: n.dateOfBirth,
            percentageShare: n.percentageShare,
            minorNomineeFlag: n.minorNomineeFlag,
            guardianName: n.guardianDetails.name,
            guardianRelationship: n.guardianDetails.relationship
          }))
        };
        
        // Send data to backend
        await api.post(`/registration/nominee-details?userId=${userId}`, nomineeData);
        
        // Navigate to upload documents
        navigate('/upload-documents');
      } catch (error) {
        console.error('Error saving nominee details:', error);
        alert('Error saving nominee details. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/scheme-selection');
  };

  const totalShare = calculateTotalShare();

  if (isLoading) {
    return (
      <div className="nominee-page">
        <div className='loading-spinner'>
          <div className='spinner'></div>
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="nominee-page">         
    <div className="nominee-container">
        <div className="form-container">
          <h3>Nominee Details</h3>

          <div className="nominees-wrapper">
            <div className="nominee-nav">
              {nominees.map((nominee, index) => (
                <button
                  key={nominee.id}
                  className={`nav-btn ${currentNomineeIndex === index ? 'active' : ''}`}
                  onClick={() => handleSwitchNominee(index)}
                >
                  Nominee {nominee.id}
                </button>
              ))}
            </div>

            <div className="nominee-section">
              <div className="nominee-title">
                <h4>--- Nominee {nominees[currentNomineeIndex].id} ---</h4>
                {nominees.length > 1 && (
                  <button className="remove-btn" onClick={handleRemoveNominee}>
                    Remove
                  </button>
                )}
              </div>

              <div className="form-fields-container">
                <div className="form-group">
                  <label>First Name: <span className="required-star">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={nominees[currentNomineeIndex].firstName}
                    onChange={(e) =>
                      handleInputChange(currentNomineeIndex, 'firstName', e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Last Name:</label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={nominees[currentNomineeIndex].lastName}
                    onChange={(e) =>
                      handleInputChange(currentNomineeIndex, 'lastName', e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Relationship: <span className="required-star">*</span></label>
                  <select
                    value={nominees[currentNomineeIndex].relationship}
                    onChange={(e) =>
                      handleInputChange(currentNomineeIndex, 'relationship', e.target.value)
                    }
                  >
                    <option>Spouse</option>
                    <option>Child</option>
                    <option>Parent</option>
                    <option>Sibling</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Date of Birth:</label>
                  <input
                    type="date"
                    value={nominees[currentNomineeIndex].dateOfBirth}
                    onChange={(e) =>
                      handleInputChange(currentNomineeIndex, 'dateOfBirth', e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Percentage Share: <span className="required-star">*</span></label>
                  <div className="share-input-group">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nominees[currentNomineeIndex].percentageShare}
                      onChange={(e) =>
                        handleInputChange(
                          currentNomineeIndex,
                          'percentageShare',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <span className="percent-symbol">%</span>
                  </div>
                </div>

                {nominees[currentNomineeIndex].minorNomineeFlag === 'Y' && (
                  <>
                    <div className="form-group">
                      <label>Guardian Name: <span className="required-star">*</span></label>
                      <input
                        type="text"
                        placeholder="Enter guardian name"
                        value={nominees[currentNomineeIndex].guardianDetails.name}
                        onChange={(e) =>
                          handleInputChange(currentNomineeIndex, 'guardian.name', e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Guardian Relationship: <span className="required-star">*</span></label>
                      <select
                        value={nominees[currentNomineeIndex].guardianDetails.relationship}
                        onChange={(e) =>
                          handleInputChange(currentNomineeIndex, 'guardian.relationship', e.target.value)
                        }
                      >
                        <option value="">Select Relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="add-nominee-container">
              <button className="add-nominee-btn" onClick={handleAddNominee}>
                ( + ) Add Another Nominee
              </button>
            </div>

            <div className="footer-sticky">
  <div className="footer-content-inline">
    <button className="back-btn" onClick={handleBack}>
      &lt; Back
    </button>

    <div className="share-validation-inline">
      <p className={totalShare === 100 ? 'valid' : 'invalid'}>
        Total share: <strong>{totalShare}%</strong> (must be 100%)
      </p>
      {errors.share && <div className="error-message">{errors.share}</div>}
    </div>

    <button className="next-btn" onClick={handleNext} disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Next: Upload Documents'}
    </button>
  </div>
</div>
          </div>
        </div>
      </div>

      {/* Popups */}
      {showMaxPopup && (
        <div className="modal-overlay" onClick={() => setShowMaxPopup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>Only 3 nominee details are allowed.</p>
            <button className="modal-close" onClick={() => setShowMaxPopup(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      {showShareErrorPopup && (
        <div className="modal-overlay" onClick={() => setShowShareErrorPopup(false)}>
          <div className="modal share-error-popup" onClick={(e) => e.stopPropagation()}>
            <p>Total share must be exactly 100%<br />Current total: {totalShare}%</p>
            <button className="modal-close" onClick={() => setShowShareErrorPopup(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      {showRequiredFieldsPopup && (
        <div className="modal-overlay" onClick={() => setShowRequiredFieldsPopup(false)}>
          <div className="modal required-fields-popup" onClick={(e) => e.stopPropagation()}>
            <p>Please fill in all required fields:</p>
            <ul className="missing-fields-list">
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
            <button className="modal-close" onClick={() => setShowRequiredFieldsPopup(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}