// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PersonalDetails from "./auth/PersonalDetails";
import ContactDetails from "./auth/ContactDetails";
import BankTaxDetails from "./auth/BankTaxDetails";
import SchemeSelection from "./auth/SchemeSelection";
import NomineeDetails from "./auth/NomineeDetails";
import UploadDocuments from "./auth/UploadDocuments";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root ("/") to /register */}
        <Route path="/" element={<PersonalDetails/>} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/contact-details" element={<ContactDetails />} />
        <Route path="/bank-tax-details" element={<BankTaxDetails />} />
        <Route path="/scheme-selection" element={<SchemeSelection />} />
        <Route path="/nominee-details" element={<NomineeDetails />} />
        <Route path="/upload-documents" element={<UploadDocuments />} />
      </Routes>
    </Router>
  );
}

export default App;
