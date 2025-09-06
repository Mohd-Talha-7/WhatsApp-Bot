
import React, { useState, useEffect } from 'react';

// Reusable Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
}

const FormInput: React.FC<InputProps> = ({ id, label, error, ...props }) => {
  return (
    <div className="relative z-0 w-full mb-8 group">
      <input
        {...props}
        id={id}
        className={`block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer ${
          error
            ? 'border-red-500 focus:border-red-600'
            : 'border-gray-600 focus:border-cyan-500'
        }`}
        placeholder=" "
      />
      <label
        htmlFor={id}
        className={`peer-focus:font-medium absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 ${
          error
            ? 'text-red-500 peer-focus:text-red-600'
            : 'text-gray-400 peer-focus:text-cyan-500'
        }`}
      >
        {label}
      </label>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

const App: React.FC = () => {
  // State for creation form
  const [instanceName, setInstanceName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // State for QR retrieval form
  const [qrInstanceName, setQrInstanceName] = useState('');
  const [isFetchingQr, setIsFetchingQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const CREATE_URL = 'https://fastapi.ameegolabs.com/webhook/create';
  const CONNECT_URL = 'https://fastapi.ameegolabs.com/webhook/connect';

  const validateCreationForm = (showErrors = false): boolean => {
    const newErrors: { [key: string]: string | null } = {};

    // Validate WhatsApp Number first as Instance Name depends on it
    if (!whatsappNumber) {
        newErrors.whatsappNumber = 'WhatsApp Number is required.';
    } else if (!/^\d{10}$/.test(whatsappNumber)) {
        newErrors.whatsappNumber = 'WhatsApp Number must be exactly 10 digits.';
    }

    // Validate Instance Name based on WhatsApp Number
    if (!instanceName) {
        newErrors.instanceName = 'Instance Name is required.';
    } else if (newErrors.whatsappNumber) { // If there's already a WhatsApp number error, do a general format check
        if (!/^Bot-\d{10}$/.test(instanceName)) {
            newErrors.instanceName = 'Format must be Bot- followed by 10 digits.';
        }
    } else { // If WhatsApp number is valid, enforce strict matching
        const expectedInstanceName = `Bot-${whatsappNumber}`;
        if (instanceName !== expectedInstanceName) {
            newErrors.instanceName = `Instance Name must be "${expectedInstanceName}".`;
        }
    }

    // Validate API Key
    if (!apiKey) {
        newErrors.apiKey = 'Apikey For Instance is required.';
    } else if (apiKey !== instanceName) {
        newErrors.apiKey = 'API Key must exactly match the Instance Name.';
    }
    
    if(showErrors) {
      setErrors(newErrors);
    }
    return Object.values(newErrors).every(error => error === null || error === undefined);
  };
  
  // Effect for real-time validation
  useEffect(() => {
    validateCreationForm(true);
  }, [instanceName, apiKey, whatsappNumber]);


  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
  
    if (!validateCreationForm(true)) {
      return;
    }
  
    setIsSubmitting(true);
  
    const formData = {
      InstanceName: instanceName,
      ApiKey: apiKey,
      WhatsAppNumber: whatsappNumber,
    };
  
    try {
      const response = await fetch(CREATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json().catch(() => {
        throw new Error('Failed to parse server response. Please try again.');
      });
  
      if (response.ok && data.success === true) {
        setSubmitSuccess('Instance created successfully! Now you can get your QR code.');
        setInstanceName('');
        setApiKey('');
        setWhatsappNumber('');
        setErrors({});
      } else {
        // This handles both failed HTTP statuses and responses where success is false
        throw new Error(data.message || 'An unknown error occurred during instance creation.');
      }
  
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQrError(null);
    setQrCodeUrl(null);

    if (!qrInstanceName.trim()) {
        setQrError('Please enter an Instance Name.');
        return;
    }

    setIsFetchingQr(true);

    try {
        const fetchPromise = fetch(CONNECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ InstanceName: qrInstanceName }),
        });
        
        // Artificial delay of 10 seconds as requested
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 10000));
        
        // Wait for both fetch to complete and 10 seconds to pass
        const [response] = await Promise.all([fetchPromise, timeoutPromise]);


        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Instance not found or invalid data.');
        }

        const data = await response.json();
        // The prompt specified the response key is 'qrCode'
        const qrSrc = data.qrCode; 

        if (!qrSrc) {
            throw new Error('QR Code not found in the response.');
        }
        
        setQrCodeUrl(qrSrc);

    } catch (error) {
        setQrError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setIsFetchingQr(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white/10 backdrop-blur-md p-8 sm:p-12 rounded-2xl shadow-2xl max-w-lg w-full border border-white/20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white">Create Your AI Bot</h1>
        </div>

        {/* --- Create Instance Form --- */}
        <section>
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6 text-center">Create New Instance</h2>
          <form onSubmit={handleCreateSubmit} noValidate>
            <FormInput id="whatsappNumber" label="WhatsApp Number" type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} error={errors.whatsappNumber} required />
            <FormInput id="instanceName" label="Instance Name" type="text" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} error={errors.instanceName} required />
            <FormInput id="apiKey" label="Apikey For Instance" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} error={errors.apiKey} required />
            
            {submitSuccess && (
                <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm my-4" role="alert">
                    {submitSuccess}
                </div>
            )}
            {submitError && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm my-4" role="alert">
                    {submitError}
                </div>
            )}

            <button type="submit" disabled={isSubmitting || !validateCreationForm()} className="w-full text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center">
              {isSubmitting ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating instance...</> ) : ( 'Create Instance' )}
            </button>
          </form>
        </section>

        <hr className="my-10 border-gray-600" />

        {/* --- Get QR Code Form --- */}
        <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-6 text-center">Get Instance QR Code</h2>
            <form onSubmit={handleQrSubmit} noValidate>
                <FormInput id="qrInstanceName" label="Enter Instance Name" type="text" value={qrInstanceName} onChange={(e) => setQrInstanceName(e.target.value)} required />
                <button type="submit" disabled={isFetchingQr} className="w-full text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:outline-none focus:ring-teal-800 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center">
                    {isFetchingQr ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</> ) : ( 'Get QR Code' )}
                </button>
            </form>
            {isFetchingQr && (
              <p className="text-center text-cyan-400 mt-4">Generating QR code, please wait...</p>
            )}
            {qrError && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm mt-4" role="alert">
                    {qrError}
                </div>
            )}
            {qrCodeUrl && !isFetchingQr && (
                 <div className="mt-6 flex flex-col items-center gap-4 text-center">
                    <p className="text-green-400 font-semibold">Scan this QR code in WhatsApp!</p>
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <img src={qrCodeUrl} alt="QR Code" style={{width: '250px', height: '250px'}} />
                    </div>
                </div>
            )}
        </section>
      </div>
    </div>
  );
};

export default App;
