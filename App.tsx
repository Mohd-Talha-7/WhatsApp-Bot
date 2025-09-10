
import React, { useState, useEffect, useCallback } from 'react';

type Tab = 'create' | 'disconnect' | 'delete';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [isMounted, setIsMounted] = useState(false);

  // State for creation form
  const [countryCode, setCountryCode] = useState('+91');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [creationStatus, setCreationStatus] = useState<'idle' | 'creating' | 'generating_qr'>('idle');
  const [hasAttemptedCreate, setHasAttemptedCreate] = useState(false);


  // State for disconnection form
  const [disconnectCountryCode, setDisconnectCountryCode] = useState('+91');
  const [disconnectWhatsappNumber, setDisconnectWhatsappNumber] = useState('');
  const [disconnectInputError, setDisconnectInputError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectSuccess, setDisconnectSuccess] = useState<string | null>(null);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [hasAttemptedDisconnect, setHasAttemptedDisconnect] = useState(false);

  // State for deletion form
  const [deleteCountryCode, setDeleteCountryCode] = useState('+91');
  const [deleteWhatsappNumber, setDeleteWhatsappNumber] = useState('');
  const [deleteInputError, setDeleteInputError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hasAttemptedDelete, setHasAttemptedDelete] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


  const CREATE_URL = 'https://fastapi.ameegolabs.com/webhook/create';
  const DISCONNECT_URL = 'https://fastapi.ameegolabs.com/webhook/disconnect';
  const DELETE_URL = 'https://fastapi.ameegolabs.com/webhook/delete';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateCreationForm = useCallback((showErrors = false): boolean => {
    const newErrors: { [key: string]: string | null } = {};

    if (!name.trim()) {
        newErrors.name = 'Name is required.';
    } else {
        newErrors.name = null;
    }

    if (!countryCode) {
        newErrors.whatsappNumber = 'Country code is required.';
    } else if (!/^\+\d{1,4}$/.test(countryCode)) {
        newErrors.whatsappNumber = 'Invalid country code format (e.g., +91).';
    } else if (!whatsappNumber) {
        newErrors.whatsappNumber = 'WhatsApp Number is required.';
    } else if (!/^\d{10}$/.test(whatsappNumber)) {
        newErrors.whatsappNumber = 'WhatsApp Number must be exactly 10 digits.';
    } else {
        newErrors.whatsappNumber = null;
    }
    
    if (!email) {
        newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address.';
    } else {
        newErrors.email = null;
    }

    if(showErrors) {
      setErrors(newErrors);
    }
    return !newErrors.whatsappNumber && !newErrors.email && !newErrors.name;
  }, [name, countryCode, whatsappNumber, email]);

  useEffect(() => {
    if (hasAttemptedCreate) {
      validateCreationForm(true);
    }
  }, [hasAttemptedCreate, validateCreationForm]);
  
  const validateDisconnectForm = useCallback((showErrors = false): boolean => {
      let error: string | null = null;
      if (!disconnectCountryCode) {
          error = 'Country code is required.';
      } else if (!/^\+\d{1,4}$/.test(disconnectCountryCode)) {
          error = 'Invalid country code format (e.g., +91).';
      } else if (!disconnectWhatsappNumber.trim()) {
          error = 'WhatsApp Number is required.';
      } else if (!/^\d{10}$/.test(disconnectWhatsappNumber)) {
          error = 'WhatsApp Number must be exactly 10 digits.';
      }
  
      if (showErrors) {
          setDisconnectInputError(error);
      }
      return error === null;
  }, [disconnectCountryCode, disconnectWhatsappNumber]);

  useEffect(() => {
      if (hasAttemptedDisconnect) {
          validateDisconnectForm(true);
      }
  }, [hasAttemptedDisconnect, validateDisconnectForm]);

  const validateDeleteForm = useCallback((showErrors = false): boolean => {
      let error: string | null = null;
      if (!deleteCountryCode) {
          error = 'Country code is required.';
      } else if (!/^\+\d{1,4}$/.test(deleteCountryCode)) {
          error = 'Invalid country code format (e.g., +91).';
      } else if (!deleteWhatsappNumber.trim()) {
          error = 'WhatsApp Number is required.';
      } else if (!/^\d{10}$/.test(deleteWhatsappNumber)) {
          error = 'WhatsApp Number must be exactly 10 digits.';
      }
      
      if (showErrors) {
          setDeleteInputError(error);
      }
      return error === null;
  }, [deleteCountryCode, deleteWhatsappNumber]);
  
  useEffect(() => {
      if (hasAttemptedDelete) {
          validateDeleteForm(true);
      }
  }, [hasAttemptedDelete, validateDeleteForm]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    setHasAttemptedCreate(true);
    if (!validateCreationForm(true)) {
      return;
    }
  
    setSubmitError(null);
    setSubmitSuccess(null);
    setQrCodeUrl(null);
    setIsSubmitting(true);
    setCreationStatus('creating');
  
    const fullWhatsappNumber = `${countryCode.replace('+', '')}${whatsappNumber}`;

    const formData = {
      WhatsAppNumber: fullWhatsappNumber,
      Email: email,
      Name: name,
    };
  
    try {
      const createResponse = await fetch(CREATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      const createData = await createResponse.json().catch(() => {
        return { 
          success: false, 
          message: 'Server returned an invalid response. Please try again.' 
        };
      });

      if (!createResponse.ok || !createData.qrCode) {
        throw new Error(createData.message || 'An unknown error occurred and QR code was not received.');
      }

      const qrSrc = createData.qrCode;
      
      const successMessage = 'Scan this QR to connect and create bot.';
      
      setCreationStatus('generating_qr');
      
      await new Promise(resolve => setTimeout(resolve, 10000));

      setQrCodeUrl(qrSrc);
      setSubmitSuccess(successMessage);
      setWhatsappNumber('');
      setCountryCode('+91');
      setEmail('');
      setName('');
      setErrors({});
      setHasAttemptedCreate(false);
  
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
      setCreationStatus('idle');
    }
  };

  const handleDisconnectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasAttemptedDisconnect(true);
    
    if (!validateDisconnectForm(true)) {
        return;
    }

    setDisconnectError(null);
    setDisconnectSuccess(null);
    setIsDisconnecting(true);

    try {
        const fullDisconnectWhatsappNumber = `${disconnectCountryCode.replace('+', '')}${disconnectWhatsappNumber}`;
        
        const response = await fetch(DISCONNECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ WhatsAppNumber: fullDisconnectWhatsappNumber }),
        });

        const data = await response.json().catch(() => {
            if (response.ok) return { success: true, message: 'Bot disconnected successfully.' };
            throw new Error('Failed to parse server response.');
        });

        if (response.ok && data.success === true) {
            setDisconnectSuccess(data.message || 'Bot disconnected successfully!');
            setDisconnectWhatsappNumber('');
            setDisconnectCountryCode('+91');
            setHasAttemptedDisconnect(false);
        } else {
            throw new Error(data.message || 'Failed to disconnect bot.');
        }

    } catch (error) {
        setDisconnectError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setIsDisconnecting(false);
    }
  };

  const handleDeleteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasAttemptedDelete(true);
    
    if (validateDeleteForm(true)) {
        setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    setDeleteSuccess(null);
    setIsDeleting(true);

    try {
        const fullDeleteWhatsappNumber = `${deleteCountryCode.replace('+', '')}${deleteWhatsappNumber}`;
        
        const response = await fetch(DELETE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ WhatsAppNumber: fullDeleteWhatsappNumber }),
        });

        const data = await response.json().catch(() => {
            if (response.ok) return { success: true, message: 'Bot deleted successfully.' };
            throw new Error('Failed to parse server response.');
        });

        if (response.ok && data.success === true) {
            setDeleteSuccess(data.message || 'Bot deleted successfully!');
            setDeleteWhatsappNumber('');
            setDeleteCountryCode('+91');
            setHasAttemptedDelete(false);
        } else {
            throw new Error(data.message || 'Failed to delete bot. It might not exist.');
        }

    } catch (error) {
        setDeleteError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
    }
  };
  
  const TABS: { id: Tab, label: string, icon: JSX.Element }[] = [
    { id: 'create', label: 'Create Bot', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg> },
    { id: 'disconnect', label: 'Disconnect', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a9 9 0 100 18 9 9 0 000-18zm0 16a7 7 0 110-14 7 7 0 010 14zm-1-8a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0zm-5 4a1 1 0 110-2h6a1 1 0 110 2H7z" clipRule="evenodd" /></svg> },
    { id: 'delete', label: 'Delete', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> },
  ];

  const renderPhoneNumberInput = (
    idPrefix: string,
    countryCodeValue: string,
    onCountryCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    numberValue: string,
    onNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    error: string | null
  ) => (
    <div className="space-y-2">
        <label htmlFor={`${idPrefix}-whatsapp-number`} className="block text-sm font-medium text-gray-400">WhatsApp Number</label>
        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
          <input
              type="text"
              id={`${idPrefix}-country-code`}
              value={countryCodeValue}
              onChange={onCountryCodeChange}
              className="w-1/4 bg-transparent px-3 py-2.5 text-white placeholder-gray-500 outline-none"
              placeholder="+91"
              required
              aria-label="Country Code"
          />
          <span className="text-gray-600">|</span>
          <input
              type="tel"
              id={`${idPrefix}-whatsapp-number`}
              value={numberValue}
              onChange={onNumberChange}
              className="w-3/4 bg-transparent px-3 py-2.5 text-white placeholder-gray-500 outline-none"
              placeholder="10-digit number"
              required
              aria-label="WhatsApp Number"
          />
        </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
  
  const renderTextInput = (
    id: string,
    label: string,
    placeholder: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    error: string | null
  ) => (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-400">{label}</label>
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
        <input
          type="text"
          id={id}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent px-3 py-2.5 text-white placeholder-gray-500 outline-none"
          placeholder={placeholder}
          required
          aria-label={label}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );

  const renderEmailInput = (
    id: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    error: string | null
  ) => (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-400">Email Address</label>
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
        <input
          type="email"
          id={id}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent px-3 py-2.5 text-white placeholder-gray-500 outline-none"
          placeholder="you@example.com"
          required
          aria-label="Email Address"
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );

  const renderSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className={`w-full max-w-2xl bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-500 ${isMounted ? 'opacity-100 animate-fade-in-up' : 'opacity-0'}`}>
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">AI Bot Provisioner</h1>
            <p className="text-gray-400 mt-2">Create and manage your WhatsApp AI bot.</p>
          </div>

          <div className="border-b border-gray-700">
            <nav className="-mb-px flex gap-4 sm:gap-6" aria-label="Tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 shrink-0 border-b-2 px-1 pb-3 text-sm font-medium transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'create' && (
              <section>
                <form onSubmit={handleCreateSubmit} noValidate className="space-y-6">
                  {renderTextInput('create-name', 'Name', 'Enter your name', name, e => setName(e.target.value), errors.name)}
                  {renderPhoneNumberInput('create', countryCode, e => setCountryCode(e.target.value), whatsappNumber, e => setWhatsappNumber(e.target.value.replace(/\D/g, '')), errors.whatsappNumber)}
                  {renderEmailInput('create-email', email, e => setEmail(e.target.value), errors.email)}
                  
                  {submitSuccess && !qrCodeUrl && <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm" role="alert">{submitSuccess}</div>}
                  {submitError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">{submitError}</div>}
                  
                  <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-500/50 font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:hover:bg-gray-700">
                    {isSubmitting ? renderSpinner() : null}
                    {isSubmitting ? (creationStatus === 'generating_qr' ? 'Preparing QR Code...' : 'Creating...') : 'Create Bot and Get QR'}
                  </button>
                </form>
                {qrCodeUrl && !isSubmitting && (
                  <div className="mt-6 flex flex-col items-center gap-4 text-center bg-gray-900/50 p-6 rounded-lg border border-gray-700 animate-fade-in-up">
                      <p className="text-green-400 font-semibold">{submitSuccess}</p>
                      <div className="p-2 bg-white rounded-lg shadow-lg">
                        <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                      </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'disconnect' && (
              <section className="space-y-6">
                <div className="text-center bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                  <h3 className="font-semibold text-amber-300">Disconnect Your Bot</h3>
                  <p className="text-sm text-amber-400/80 mt-1">This will log your bot out of WhatsApp. You can reconnect later by getting a new QR code.</p>
                </div>
                <form onSubmit={handleDisconnectSubmit} noValidate className="space-y-6">
                  {renderPhoneNumberInput('disconnect', disconnectCountryCode, e => setDisconnectCountryCode(e.target.value), disconnectWhatsappNumber, e => setDisconnectWhatsappNumber(e.target.value.replace(/\D/g, '')), disconnectInputError)}
                  {disconnectSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm" role="alert">{disconnectSuccess}</div>}
                  {disconnectError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">{disconnectError}</div>}
                  <button type="submit" disabled={isDisconnecting} className="w-full flex items-center justify-center text-white bg-amber-600 hover:bg-amber-700 focus:ring-4 focus:outline-none focus:ring-amber-500/50 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed">
                     {isDisconnecting ? renderSpinner() : null}
                     {isDisconnecting ? 'Disconnecting...' : 'Disconnect Bot'}
                  </button>
                </form>
              </section>
            )}

            {activeTab === 'delete' && (
              <section className="space-y-6">
                <div className="text-center bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <h3 className="font-semibold text-red-300">Delete Your Bot</h3>
                  <p className="text-sm text-red-400/80 mt-1">Warning: This action is irreversible. It will permanently delete your bot, all of its data, and the associated spreadsheet.</p>
                </div>
                <form onSubmit={handleDeleteSubmit} noValidate className="space-y-6">
                  {renderPhoneNumberInput('delete', deleteCountryCode, e => setDeleteCountryCode(e.target.value), deleteWhatsappNumber, e => setDeleteWhatsappNumber(e.target.value.replace(/\D/g, '')), deleteInputError)}
                  {deleteSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm" role="alert">{deleteSuccess}</div>}
                  {deleteError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">{deleteError}</div>}
                  <button type="submit" className="w-full flex items-center justify-center text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-500/50 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed">
                     {'Delete Bot Permanently'}
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl shadow-xl w-full max-w-md p-6 text-center animate-fade-in-up">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10">
              <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white" id="delete-modal-title">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-gray-400">
              Are you sure you want to delete the bot for {deleteCountryCode}{deleteWhatsappNumber}? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 flex items-center justify-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 disabled:bg-red-800/50 disabled:cursor-not-allowed"
              >
                {isDeleting ? renderSpinner() : null}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
