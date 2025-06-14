import React, { useState } from 'react';
import OTPVerification from './OTPVerification';

import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';
import { signInWithPhoneNumber } from 'firebase/auth';


declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}



const setupRecaptcha = (mobile: string, sendOTPCallback: () => void) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      'recaptcha-container',
      {
        size: 'invisible',
        callback: sendOTPCallback,
      }
    );
  }
};


// Removed sendOTP from here. It will be defined inside the ContactStep component.



interface ContactStepProps {
  onSubmit: (formData: any) => void;
  onPrevious: () => void;
}

const ContactStep: React.FC<ContactStepProps> = ({ onSubmit, onPrevious }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: ''
  });
  const [showOTP, setShowOTP] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sentOtp, setSentOtp] = useState('');

  // Add a dummy handler for OTP back navigation (to avoid reference error)
  const handleBackFromOTP = () => {
    setShowOTP(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Move sendOTP here so it can access setShowOTP
  const sendOTP = async (mobile: string): Promise<string | undefined> => {
    setupRecaptcha(mobile, () => {});
    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = `+91${mobile}`;

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmation;
      setShowOTP(true);
      // Simulate OTP for testing/demo purposes
      const generatedOtp = '123456'; // Replace with actual OTP logic if available
      setSentOtp(generatedOtp);
      return generatedOtp;
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP. Please try again.');
      return undefined;
    }
  };
//   try {
//     const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
//     window.confirmationResult = confirmation;

//     const successMsg = document.createElement('div');
//     successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50';
//     successMsg.textContent = 'OTP sent to your mobile!';
//     document.body.appendChild(successMsg);
//     setTimeout(() => document.body.removeChild(successMsg), 3000);

//     setShowOTP(true);
//   } catch (error) {
//     console.error('SMS not sent', error);
//     alert('Failed to send OTP. Try again later.');
//   }
// };


  const handleMobileSubmit = async () => {
    if (formData.mobile.length >= 10) {
      const otp = await sendOTP(formData.mobile);
      setShowOTP(true);
      
      // Auto-fill OTP after 2 seconds using a ref callback
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('autofillOTP', { detail: otp }));
      }, 2000);
    }
  };

  const handleOTPVerified = (enteredOtp: string) => {
    if (enteredOtp === sentOtp) {
      setIsVerified(true);
      setShowOTP(false);
      return true;
    }
    return false;
  };
  const handleResendOTP = async () => {
    const otp = await sendOTP(formData.mobile);
    if (otp) {
      setSentOtp(otp);
      // Auto-fill OTP after 2 seconds for resend too
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('autofillOTP', { detail: otp }));
      }, 2000);
    }
  };
    // Auto-fill OTP after 2 seconds for resend too
  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.name && formData.email && formData.mobile && formData.address && isVerified;

  return showOTP ? (
    <>
      <OTPVerification
        mobile={formData.mobile}
        onVerified={handleOTPVerified}
        onBack={handleBackFromOTP}
        onResend={handleResendOTP}
      />
      <div id="recaptcha-container"></div>
    </>
  ) : (
    <div className="animate-fade-in p-1 sm:p-2 md:p-4 w-full max-w-full overflow-hidden">
      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-center mb-2 sm:mb-3 md:mb-4 text-gray-800 px-1 sm:px-2">
        Your estimate is almost ready
      </h2>
      <p className="text-center text-gray-600 mb-3 sm:mb-4 md:mb-6 lg:mb-8 px-1 sm:px-2 text-xs sm:text-sm">
        Tailor your space with your ideal configuration
      </p>
      
      <div className="max-w-sm mx-auto space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 focus:border-yellow-400 focus:outline-none transition-colors rounded text-xs sm:text-sm"
        />
        <input
          type="email"
          name="email"
          placeholder="Email ID"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 focus:border-yellow-400 focus:outline-none transition-colors rounded text-xs sm:text-sm"
        />
        <div className="flex gap-1 sm:gap-2">
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            className="flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 focus:border-yellow-400 focus:outline-none transition-colors rounded text-xs sm:text-sm"
          />
          {formData.mobile.length >= 10 && !isVerified && (
            <button
              onClick={handleMobileSubmit}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors rounded whitespace-nowrap flex-shrink-0"
            >
              Verify
            </button>
          )}
          {isVerified && (
            <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-green-100 text-green-700 text-xs sm:text-sm font-medium rounded flex items-center whitespace-nowrap flex-shrink-0">
              ✓ Verified
            </div>
          )}
        </div>
        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 focus:border-yellow-400 focus:outline-none transition-colors resize-none rounded text-xs sm:text-sm"
        />
      </div>

      <p className="text-center text-xs text-gray-600 mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2">
        By submitting this form, you agree to our{' '}
        <a href="#" className="text-blue-600 underline">privacy policy</a>
      </p>

      <div className="flex justify-between px-1 sm:px-2 gap-2">
        <button
          onClick={onPrevious}
          className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded text-xs sm:text-sm flex-shrink-0"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 font-medium transition-all duration-200 rounded text-xs sm:text-sm flex-shrink-0 ${
            isFormValid
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Get Your Estimate
        </button>
      </div>
    </div>
  );
};

export default ContactStep;
