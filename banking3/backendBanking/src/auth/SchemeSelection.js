import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/SchemeSelection.css';

const lifeCycleFunds = [
  { value: 'B', label: 'B - Balanced Life Cycle' },
  { value: 'A', label: 'A - Auto Moderate' },
  { value: 'L', label: 'L - Auto Conservative' },
  { value: 'H', label: 'H - Auto Aggressive' }
];

function SchemeSelection() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemeChoice, setSchemeChoice] = useState('');
  const [lifeCycleFund, setLifeCycleFund] = useState('B');
  const [isLoading, setIsLoading] = useState(false);

  // Load userId from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
      fetchSchemeSelection(savedUserId);
    }
  }, []);

  // Fetch scheme selection from backend
  const fetchSchemeSelection = async (userId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/registration/scheme-selection?userId=${userId}`);
      if (response.data) {
        const data = response.data;
        setSchemeChoice(data.schemeChoice || '');
        setLifeCycleFund(data.lifeCycleFund || 'B');
        // Update localStorage with fetched data
        localStorage.setItem('schemeSelection', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching scheme selection:', error);
      // If not found, try to load from localStorage
      try {
        const savedSchemeSelection = localStorage.getItem('schemeSelection');
        if (savedSchemeSelection) {
          const parsedData = JSON.parse(savedSchemeSelection);
          setSchemeChoice(parsedData.schemeChoice || '');
          setLifeCycleFund(parsedData.lifeCycleFund || 'B');
        }
      } catch (error) {
        console.error('Error loading scheme selection from localStorage:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = {
        schemeChoice,
        lifeCycleFund
      };
      
      // Save to localStorage
      localStorage.setItem('schemeSelection', JSON.stringify(data));
      
      // Send data to backend
      await api.post(`/registration/scheme-selection?userId=${userId}`, data);
      
      // Navigate to nominee details
      navigate('/nominee-details');
    } catch (error) {
      console.error('Error saving scheme selection:', error);
      alert('Error saving scheme selection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/bank-tax-details');
  };

  if (isLoading) {
    return (
      <div className="screen4-container">
        <div className='loading-spinner'>
          <div className='spinner'></div>
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen4-container">
      <div className="screen4-step">
        <div className="screen4-step-text">
          <span>Scheme Selection (Step 4 of 6)</span>
        </div>
      </div>
      <form className="screen4-form">
        <h1>Investment Scheme (Tier 1)</h1>
        <p className="screen4-subtitle">Choose your investment option:</p>
        <div className="screen4-choice-group">
          <label className="screen4-radio">
            <input
              type="radio"
              name="schemeChoice"
              value="auto"
              checked={schemeChoice === 'auto'}
              onChange={() => setSchemeChoice('auto')}
            />
            <span>Auto Choice</span>
          </label>
          <label className="screen4-radio">
            <input
              type="radio"
              name="schemeChoice"
              value="active"
              checked={schemeChoice === 'active'}
              onChange={() => setSchemeChoice('active')}
            />
            <span>Active Choice</span>
          </label>
        </div>
        {schemeChoice === 'auto' && (
          <div className="screen4-auto">
            <div className="screen4-auto-header">Auto Choice</div>
            <label className="screen4-select-label" htmlFor="lifeCycleFund">
              Select Life Cycle Fund:
            </label>
            <select
              id="lifeCycleFund"
              className="screen4-select"
              value={lifeCycleFund}
              onChange={(event) => setLifeCycleFund(event.target.value)}
            >
              {lifeCycleFunds.map((fund) => (
                <option key={fund.value} value={fund.value}>
                  {fund.label}
                </option>
              ))}
            </select>
            <p className="screen4-note">
              This choice will automatically allocate your funds across E, C, G.
            </p>
          </div>
        )}
        {schemeChoice === 'active' && (
          <div className="screen4-active" />
        )}
        <div className="screen4-buttons">
          <button type="button" className="screen4-back" onClick={handleBack}>&lt; Back</button>
          <button type="submit" className="screen4-next" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Next: Add Nominees'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SchemeSelection;