import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { Home, Calculator, Settings, FileText, Lock, Unlock, Weight, AreaChart, ShieldAlert, RotateCcw } from 'lucide-react'; // Icons

// Create a context for Firebase and user data
const AppContext = createContext();

// App Provider to wrap the application and provide Firebase/Auth context
const AppProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false); // Admin state

    const [providerMessage, setMessage] = useState(''); // State for displaying messages within the AppProvider

    useEffect(() => {
        console.log("AppProvider: Initializing Firebase...");
        let unsubscribeAuth = () => {}; // Initialize for cleanup

        try {
const firebaseConfig = typeof window.__firebase_config !== 'undefined' ? window.__firebase_config : {};
            console.log("AppProvider: firebaseConfig:", firebaseConfig);

            // Crucial check: Ensure firebaseConfig is not empty before initializing
            if (Object.keys(firebaseConfig).length === 0) {
                console.error("AppProvider: Firebase config is empty or invalid. Cannot initialize Firebase.");
                setMessage("Firebase configuration is missing or invalid. Please contact support.");
                setIsAuthReady(true); // Mark auth as ready but without Firebase to prevent infinite loading
                return; // Exit useEffect
            }

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            console.log("AppProvider: appId:", appId);

            const firebaseApp = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(firebaseApp);
            const firebaseAuth = getAuth(firebaseApp);

            setApp(firebaseApp);
            setDb(firestoreDb);
            setAuth(firebaseAuth);

            // Sign in with custom token if available, otherwise anonymously
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

            if (initialAuthToken) {
                signInWithCustomToken(firebaseAuth, initialAuthToken)
                    .then((userCredential) => {
                        console.log("AppProvider: Signed in with custom token:", userCredential.user.uid);
                    })
                    .catch((error) => {
                        console.error("AppProvider: Error signing in with custom token:", error);
                        signInAnonymously(firebaseAuth)
                            .then(() => console.log("AppProvider: Signed in anonymously due to custom token error"))
                            .catch((anonError) => console.error("AppProvider: Error signing in anonymously:", anonError));
                    });
            } else {
                signInAnonymously(firebaseAuth)
                    .then(() => console.log("AppProvider: Signed in anonymously"))
                    .catch((error) => console.error("AppProvider: Error signing in anonymously:", error));
            }

            // Listen for auth state changes
            unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    setUserId(user.uid);
                    console.log("AppProvider: Auth state changed, user ID:", user.uid);
                } else {
                    setUserId(null);
                    console.log("AppProvider: Auth state changed, no user.");
                }
                setIsAuthReady(true); // Auth state is ready
                console.log("AppProvider: isAuthReady set to true.");
            });

        } catch (error) {
            console.error("AppProvider: Failed to initialise Firebase:", error);
            setMessage(`Failed to initialise application: ${error.message}`);
            setIsAuthReady(true); // Ensure auth ready is set even on error to prevent infinite loading
        }

        return () => unsubscribeAuth(); // Cleanup auth listener on unmount
    }, []);

    const value = { app, db, auth, userId, isAuthReady, isAdmin, setIsAdmin };

    return (
        <AppContext.Provider value={value}>
            {providerMessage ? (
                <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg text-center min-h-screen flex items-center justify-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Application Error</h2>
                        <p>{providerMessage}</p>
                        <p className="mt-4 text-sm">Please check the browser console for more details.</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AppContext.Provider>
    );
};

// Custom hook to use the context
const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        console.error("Error: useAppContext must be used within an AppProvider.");
        throw new Error("useAppContext must be used within an AppProvider.");
    }
    return context;
};

// Header Component
const Header = ({ currentPage, setCurrentPage, isAdmin, setIsAdmin }) => {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [loginMessage, setLoginMessage] = useState('');

    const handleAdminLogin = () => {
        if (adminPassword === 'EFI') {
            setIsAdmin(true);
            setLoginMessage('Logged in as Admin!');
            setShowAdminLogin(false);
        } else {
            setLoginMessage('Incorrect password.');
        }
    };

    const handleAdminLogout = () => {
        setIsAdmin(false);
        setAdminPassword('');
        setLoginMessage('');
        setShowAdminLogin(false);
    };

    return (
        <header className="bg-gray-800 text-white p-4 shadow-lg rounded-b-lg">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-indigo-300 mb-2 md:mb-0">EUDR Calculator</h1>
                <nav className="flex space-x-4">
                    <button
                        onClick={() => setCurrentPage('home')}
                        className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${currentPage === 'home' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                    >
                        <Home className="w-5 h-5 mr-2" /> Home
                    </button>
                    <button
                        onClick={() => setCurrentPage('calculator')}
                        className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${currentPage === 'calculator' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                    >
                        <Calculator className="w-5 h-5 mr-2" /> Calculator
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setCurrentPage('admin')}
                            className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${currentPage === 'admin' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                        >
                            <Settings className="w-5 h-5 mr-2" /> Admin
                        </button>
                    )}
                    <button
                        onClick={() => setShowAdminLogin(!showAdminLogin)}
                        className="px-4 py-2 rounded-lg flex items-center hover:bg-gray-700 transition-all duration-200"
                    >
                        {isAdmin ? <Unlock className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                        {isAdmin ? 'Admin log out' : 'Admin log in'}
                    </button>
                </nav>
            </div>
            {showAdminLogin && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-4">
                    {!isAdmin ? (
                        <>
                            <input
                                type="password"
                                placeholder="Admin password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleAdminLogin}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                Log in
                            </button>
                            {loginMessage && <p className="text-red-300">{loginMessage}</p>}
                        </>
                    ) : (
                        <button
                            onClick={handleAdminLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                        >
                            Log out
                        </button>
                    )}
                </div>
            )}
        </header>
    );
};

// Home Component
const HomeSection = () => {
    return (
        <div className="p-8 bg-white shadow-lg rounded-lg text-gray-800 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-2">Welcome to the EUDR Calculator</h2>
            <p className="text-lg leading-relaxed mb-4">
                The EU Deforestation Regulation (EUDR) mandates that commodities placed on the EU market—including cocoa, coffee, rubber, palm oil, and soy—must be deforestation-free and legally produced. This calculator provides a transparent, standardised, and open-access tool to help verify due diligence claims for processed products.
            </p>
            <p className="text-lg leading-relaxed mb-4">
                It converts processed product volumes into raw commodity equivalents, estimates planted area based on country-specific yield data, and enables traceability and risk assessment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-indigo-50 p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold text-indigo-600 mb-3 flex items-center">
                        <Calculator className="w-6 h-6 mr-2 text-indigo-500" /> Key features
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li><strong>Conversion Engine:</strong> Converts processed product quantities into raw commodity equivalents.</li>
                        <li><strong>Planted Area Estimator:</strong> Estimates the area required based on country-specific yield data.</li>
                        <li><strong>Traceability & Risk Checker:</strong> Flags countries or regions with known traceability gaps or legality risks.</li>
                        <li><strong>Admin Dashboard:</strong> Manage conversion ratios, product types, yield data, and risk flags.</li>
                        <li><strong>Report Generator:</strong> Outputs downloadable summaries for due diligence documentation.</li>
                    </ul>
                </div>
                <div className="bg-green-50 p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold text-green-600 mb-3 flex items-center">
                        <FileText className="w-6 h-6 mr-2 text-green-500" /> Target users
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Competent Authorities in EU Member States</li>
                        <li>NGOs monitoring deforestation and supply chain transparency</li>
                        <li>Importers, traders, and processors</li>
                        <li>Certification bodies and auditors</li>
                    </ul>
                </div>
            </div>
            <p className="text-center text-gray-600 mt-10 text-sm">
                For more information, navigate to the Calculator or Admin sections.
            </p>
        </div>
    );
};

// Calculator Component
const CalculatorSection = () => {
    const { db, isAuthReady, userId } = useAppContext();
    const [productTypes, setProductTypes] = useState([]);
    const [conversionRatios, setConversionRatios] = useState([]);
    const [yieldData, setYieldData] = useState([]);
    const [riskFlags, setRiskFlags] = useState([]);

    const [selectedCommodity, setSelectedCommodity] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [originCountry, setOriginCountry] = useState('');

    const [rawEquivalent, setRawEquivalent] = useState(null);
    const [plantedArea, setPlantedArea] = useState(null);
    const [riskScore, setRiskScore] = useState(null);
    const [riskDescription, setRiskDescription] = useState('');

    const [message, setMessage] = useState(''); // For user messages/errors

    // Fetch data from Firestore

    useEffect(() => {
        if (!db || !isAuthReady) return;

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const publicDataPath = `/artifacts/${appId}/public/data`;

        const unsubProductTypes = onSnapshot(collection(db, `${publicDataPath}/productTypes`), (snapshot) => {
            setProductTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Error fetching product types:", error));

        const unsubConversionRatios = onSnapshot(collection(db, `${publicDataPath}/conversionRatios`), (snapshot) => {
            setConversionRatios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Error fetching conversion ratios:", error));

        const unsubYieldData = onSnapshot(collection(db, `${publicDataPath}/yieldData`), (snapshot) => {
            setYieldData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Error fetching yield data:", error));

        const unsubRiskFlags = onSnapshot(collection(db, `${publicDataPath}/riskFlags`), (snapshot) => {
            setRiskFlags(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Error fetching risk flags:", error));

        return () => {
            unsubProductTypes();
            unsubConversionRatios();
            unsubYieldData();
            unsubRiskFlags();
        };
    }, [db, isAuthReady, userId]); // Added userId as a dependency as it's used in the outer scope for appId construction

    // Perform calculations when inputs or data change
    useEffect(() => {
        if (!selectedCommodity || !selectedProduct || !quantity || !originCountry || isNaN(parseFloat(quantity))) {
            setRawEquivalent(null);
            setPlantedArea(null);
            setRiskScore(null);
            setRiskDescription('');
            return;
        }

        const product = productTypes.find(p => p.id === selectedProduct && p.commodity === selectedCommodity);
        if (!product) {
            setMessage("Selected processed product not found for the chosen raw commodity.");
            return;
        }

        const commodity = product.commodity;
        const qty = parseFloat(quantity);

        // 1. Conversion Engine
        const conversion = conversionRatios.find(c => c.processedProduct === product.name && c.commodity === commodity);
        let rawEq = null;
        if (conversion) {
            rawEq = qty * conversion.ratio;
            setRawEquivalent(rawEq.toFixed(2));
        } else {
            setMessage(`Conversion ratio for ${product.name} (${commodity}) not found.`);
            setRawEquivalent(null);
        }

        // 2. Planted Area Estimator
        if (rawEq !== null) {
            const yieldInfo = yieldData.find(y => y.country === originCountry && y.commodity === commodity);
            if (yieldInfo && yieldInfo.yield > 0) {
                const area = rawEq / yieldInfo.yield;
                setPlantedArea(area.toFixed(4)); // Hectares
            } else {
                setMessage(`Yield data for ${commodity} in ${originCountry} not found or is zero.`);
                setPlantedArea(null);
            }
        } else {
            setPlantedArea(null);
        }

        // 3. Traceability & Risk Checker
        const risk = riskFlags.find(r => r.country === originCountry);
        if (risk) {
            setRiskScore(risk.riskLevel);
            setRiskDescription(risk.description);
        } else {
            setRiskScore('Low/Unknown');
            setRiskDescription('No specific risk flags found for this country.');
        }

        setMessage(''); // Clear any previous messages
    }, [selectedCommodity, selectedProduct, quantity, originCountry, productTypes, conversionRatios, yieldData, riskFlags]);

    const handleGenerateReport = () => {
        if (!rawEquivalent || !plantedArea) {
            setMessage("Please complete the calculation before generating a report.");
            return;
        }

        const reportContent = `
EUDR Due Diligence Report

Product details:
  Raw Commodity: ${selectedCommodity || 'N/A'}
  Processed Product: ${productTypes.find(p => p.id === selectedProduct)?.name || 'N/A'}
  Quantity: ${quantity} kg
  Origin Country: ${originCountry}

Conversion details:
  Raw Commodity Equivalent: ${rawEquivalent} kg

Planted area estimation:
  Estimated Planted Area: ${plantedArea} hectares

Traceability and risk assessment:
  Risk Level: ${riskScore}
  Risk Description: ${riskDescription}

Generated by EUDR Calculator.
        `;

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EUDR_Report_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMessage("Report downloaded successfully!");
    };

    const handleReset = () => {
        setSelectedCommodity('');
        setSelectedProduct('');
        setQuantity('');
        setOriginCountry('');
        setRawEquivalent(null);
        setPlantedArea(null);
        setRiskScore(null);
        setRiskDescription('');
        setMessage('');
    };

    // Get unique raw commodities for the first dropdown
    const availableCommodities = [...new Set(productTypes.map(p => p.commodity))].sort();

    // Filter processed products based on selected raw commodity
    const filteredProcessedProducts = productTypes
        .filter(p => p.commodity === selectedCommodity)
        .sort((a, b) => a.name.localeCompare(b.name));

    // Filter countries based on selected raw commodity
    const availableCountries = [...new Set(
        yieldData
            .filter(y => y.commodity === selectedCommodity)
            .map(y => y.country)
    )].sort();


    return (
        <div className="p-8 bg-white shadow-lg rounded-lg text-gray-800 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-2">EUDR Calculator</h2>

            {message && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
                    <p className="font-bold">Information:</p>
                    <p>{message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">Input details</h3>
                    <div className="mb-4">
                        <label htmlFor="rawCommodity" className="block text-gray-700 text-sm font-bold mb-2">Raw commodity:</label>
                        <select
                            id="rawCommodity"
                            value={selectedCommodity}
                            onChange={(e) => {
                                setSelectedCommodity(e.target.value);
                                setSelectedProduct(''); // Reset processed product when commodity changes
                                setOriginCountry(''); // Reset country when commodity changes
                            }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select a raw commodity</option>
                            {availableCommodities.map(commodity => (
                                <option key={commodity} value={commodity}>{commodity}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="processedProduct" className="block text-gray-700 text-sm font-bold mb-2">Processed product:</label>
                        <select
                            id="processedProduct"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
                            disabled={!selectedCommodity}
                        >
                            <option value="">Select a processed product</option>
                            {filteredProcessedProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity (kg):</label>
                        <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g., 1000"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Origin country:</label>
                        <select
                            id="country"
                            value={originCountry}
                            onChange={(e) => setOriginCountry(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
                            disabled={!selectedCommodity}
                        >
                            <option value="">Select an origin country</option>
                            {availableCountries.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={handleReset}
                            className="w-1/2 mr-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" /> Reset
                        </button>
                        <button
                            onClick={handleGenerateReport}
                            disabled={!rawEquivalent || !plantedArea}
                            className="w-1/2 ml-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <FileText className="w-5 h-5 mr-2" /> Generate report
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-blue-50 p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold text-blue-700 mb-4">Calculation results</h3>
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 flex items-center">
                            <Weight className="w-6 h-6 mr-3 text-blue-600" />
                            <div>
                                <p className="text-gray-600 text-sm">Raw commodity equivalent:</p>
                                <p className="text-2xl font-bold text-blue-800">
                                    {rawEquivalent !== null ? `${rawEquivalent} kg` : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 flex items-center">
                            <AreaChart className="w-6 h-6 mr-3 text-blue-600" />
                            <div>
                                <p className="text-gray-600 text-sm">Estimated planted area:</p>
                                <p className="text-2xl font-bold text-blue-800">
                                    {plantedArea !== null ? `${plantedArea} hectares` : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 flex items-center">
                            <ShieldAlert className="w-6 h-6 mr-3 text-blue-600" />
                            <div>
                                <p className="text-gray-600 text-sm">Traceability and risk score:</p>
                                <p className={`text-2xl font-bold ${riskScore === 'High' ? 'text-red-600' : riskScore === 'Medium' ? 'text-orange-600' : 'text-green-600'}`}>
                                    {riskScore !== null ? riskScore : 'N/A'}
                                </p>
                                {riskDescription && (
                                    <p className="text-gray-600 text-sm mt-2">{riskDescription}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Admin Dashboard Component
const AdminDashboard = () => {
    const { db, isAuthReady, userId } = useAppContext();
    const [activeTab, setActiveTab] = useState('conversionRatios');
    const [message, setMessage] = useState('');

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const publicDataPath = `/artifacts/${appId}/public/data`;

    // Generic CRUD operations for admin

        const fetchData = (collectionName, setState) => {
        if (!db || !isAuthReady) return;
        const unsub = onSnapshot(collection(db, `${publicDataPath}/${collectionName}`), (snapshot) => {
            setState(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error(`Error fetching ${collectionName}:`, error));
        return unsub;
    };

    const addDataItem = async (collectionName, data) => {
        try {
            await addDoc(collection(db, `${publicDataPath}/${collectionName}`), data);
            setMessage(`Successfully added to ${collectionName}.`);
        } catch (e) {
            console.error("Error adding document: ", e);
            setMessage(`Error adding to ${collectionName}: ${e.message}`);
        }
    };

    const updateDataItem = async (collectionName, id, data) => {
        try {
            await setDoc(doc(db, `${publicDataPath}/${collectionName}`, id), data, { merge: true });
            setMessage(`Successfully updated in ${collectionName}.`);
        } catch (e) {
            console.error("Error updating document: ", e);
            setMessage(`Error updating in ${collectionName}: ${e.message}`);
        }
    };

    const deleteDataItem = async (collectionName, id) => {
        try {
            await deleteDoc(doc(db, `${publicDataPath}/${collectionName}`, id));
            setMessage(`Successfully deleted from ${collectionName}.`);
        } catch (e) {
            console.error("Error deleting document: ", e);
            setMessage(`Error deleting from ${collectionName}: ${e.message}`);
        }
    };

    // Conversion Ratios Management
    const ConversionRatiosManager = () => {
        const [ratios, setRatios] = useState([]);
        const [newRatio, setNewRatio] = useState({ commodity: '', processedProduct: '', ratio: '' });
        const [editingId, setEditingId] = useState(null);


                useEffect(() => fetchData('conversionRatios', setRatios), [db, isAuthReady]);

        const handleAddOrUpdate = async () => {
            if (!newRatio.commodity || !newRatio.processedProduct || isNaN(parseFloat(newRatio.ratio))) {
                setMessage('Please fill all fields for conversion ratio.');
                return;
            }
            const dataToSave = { ...newRatio, ratio: parseFloat(newRatio.ratio) };
            if (editingId) {
                await updateDataItem('conversionRatios', editingId, dataToSave);
                setEditingId(null);
            } else {
                await addDataItem('conversionRatios', dataToSave);
            }
            setNewRatio({ commodity: '', processedProduct: '', ratio: '' });
        };

        const handleEdit = (item) => {
            setNewRatio({ commodity: item.commodity, processedProduct: item.processedProduct, ratio: item.ratio });
            setEditingId(item.id);
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Manage conversion ratios</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Commodity (e.g., Cocoa)"
                        value={newRatio.commodity}
                        onChange={(e) => setNewRatio({ ...newRatio, commodity: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="text"
                        placeholder="Processed product (e.g., Cocoa butter)"
                        value={newRatio.processedProduct}
                        onChange={(e) => setNewRatio({ ...newRatio, processedProduct: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="number"
                        placeholder="Ratio (e.g., 1.2)"
                        value={newRatio.ratio}
                        onChange={(e) => setNewRatio({ ...newRatio, ratio: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleAddOrUpdate}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {editingId ? 'Update ratio' : 'Add ratio'}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Commodity</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Processed product</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Ratio</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ratios.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{item.commodity}</td>
                                    <td className="py-2 px-4 border-b">{item.processedProduct}</td>
                                    <td className="py-2 px-4 border-b">{item.ratio}</td>
                                    <td className="py-2 px-4 border-b flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteDataItem('conversionRatios', item.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Product Types Management
    const ProductTypesManager = () => {
        const [productTypes, setProductTypes] = useState([]);
        const [newProductType, setNewProductType] = useState({ commodity: '', name: '' });
        const [editingId, setEditingId] = useState(null);


                useEffect(() => fetchData('productTypes', setProductTypes), [db, isAuthReady]);

        const handleAddOrUpdate = async () => {
            if (!newProductType.commodity || !newProductType.name) {
                setMessage('Please fill all fields for product type.');
                return;
            }
            if (editingId) {
                await updateDataItem('productTypes', editingId, newProductType);
                setEditingId(null);
            } else {
                await addDataItem('productTypes', newProductType);
            }
            setNewProductType({ commodity: '', name: '' });
        };

        const handleEdit = (item) => {
            setNewProductType({ commodity: item.commodity, name: item.name });
            setEditingId(item.id);
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Manage processed product types</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Commodity (e.g., Coffee)"
                        value={newProductType.commodity}
                        onChange={(e) => setNewProductType({ ...newProductType, commodity: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="text"
                        placeholder="Product name (e.g., Roasted coffee)"
                        value={newProductType.name}
                        onChange={(e) => setNewProductType({ ...newProductType, name: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleAddOrUpdate}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {editingId ? 'Update product type' : 'Add product type'}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Commodity</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Product name</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productTypes.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{item.commodity}</td>
                                    <td className="py-2 px-4 border-b">{item.name}</td>
                                    <td className="py-2 px-4 border-b flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteDataItem('productTypes', item.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Yield Data Management
    const YieldDataManager = () => {
        const [yields, setYields] = useState([]);
        const [newYield, setNewYield] = useState({ country: '', commodity: '', yield: '' });
        const [editingId, setEditingId] = useState(null);


                useEffect(() => fetchData('yieldData', setYields), [db, isAuthReady]);

        const handleAddOrUpdate = async () => {
            if (!newYield.country || !newYield.commodity || isNaN(parseFloat(newYield.yield))) {
                setMessage('Please fill all fields for yield data.');
                return;
            }
            const dataToSave = { ...newYield, yield: parseFloat(newYield.yield) };
            if (editingId) {
                await updateDataItem('yieldData', editingId, dataToSave);
                setEditingId(null);
            } else {
                await addDataItem('yieldData', dataToSave);
            }
            setNewYield({ country: '', commodity: '', yield: '' });
        };

        const handleEdit = (item) => {
            setNewYield({ country: item.country, commodity: item.commodity, yield: item.yield });
            setEditingId(item.id);
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Manage country-specific yield data (kg/ha/year)</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Country (e.g., Brazil)"
                        value={newYield.country}
                        onChange={(e) => setNewYield({ ...newYield, country: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="text"
                        placeholder="Commodity (e.g., Soy)"
                        value={newYield.commodity}
                        onChange={(e) => setNewYield({ ...newYield, commodity: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="number"
                        placeholder="Yield (e.g., 2500)"
                        value={newYield.yield}
                        onChange={(e) => setNewYield({ ...newYield, yield: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleAddOrUpdate}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {editingId ? 'Update yield' : 'Add yield'}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Country</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Commodity</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Yield (kg/ha/year)</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {yields.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{item.country}</td>
                                    <td className="py-2 px-4 border-b">{item.commodity}</td>
                                    <td className="py-2 px-4 border-b">{item.yield}</td>
                                    <td className="py-2 px-4 border-b flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteDataItem('yieldData', item.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Risk Flags Management
    const RiskFlagsManager = () => {
        const [riskFlags, setRiskFlags] = useState([]);
        const [newFlag, setNewFlag] = useState({ country: '', riskLevel: 'Low', description: '' });
        const [editingId, setEditingId] = useState(null);


                useEffect(() => fetchData('riskFlags', setRiskFlags), [db, isAuthReady]);

        const handleAddOrUpdate = async () => {
            if (!newFlag.country || !newFlag.riskLevel || !newFlag.description) {
                setMessage('Please fill all fields for risk flag.');
                return;
            }
            const dataToSave = { ...newFlag, riskLevel: newFlag.riskLevel, description: newFlag.description }; // Ensure riskLevel is string
            if (editingId) {
                await updateDataItem('riskFlags', editingId, dataToSave);
                setEditingId(null);
            } else {
                await addDataItem('riskFlags', dataToSave);
            }
            setNewFlag({ country: '', riskLevel: 'Low', description: '' });
        };

        const handleEdit = (item) => {
            setNewFlag({ country: item.country, riskLevel: item.riskLevel, description: item.description });
            setEditingId(item.id);
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Manage traceability risk flags</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Country (e.g., Indonesia)"
                        value={newFlag.country}
                        onChange={(e) => setNewFlag({ ...newFlag, country: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                        value={newFlag.riskLevel}
                        onChange={(e) => setNewFlag({ ...newFlag, riskLevel: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Description (e.g., Known deforestation issues)"
                        value={newFlag.description}
                        onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                        className="p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleAddOrUpdate}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {editingId ? 'Update flag' : 'Add flag'}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Country</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Risk level</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Description</th>
                                <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {riskFlags.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{item.country}</td>
                                    <td className="py-2 px-4 border-b">{item.riskLevel}</td>
                                    <td className="py-2 px-4 border-b">{item.description}</td>
                                    <td className="py-2 px-4 border-b flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteDataItem('riskFlags', item.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    return (
        <div className="p-8 bg-gray-100 shadow-lg rounded-lg text-gray-800 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-2">Admin dashboard</h2>

            {message && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md" role="alert">
                    <p className="font-bold">Success!</p>
                    <p>{message}</p>
                </div>
            )}

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('conversionRatios')}
                    className={`py-2 px-4 -mb-px border-b-2 ${activeTab === 'conversionRatios' ? 'border-indigo-500 text-indigo-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Conversion ratios
                </button>
                <button
                    onClick={() => setActiveTab('productTypes')}
                    className={`py-2 px-4 -mb-px border-b-2 ${activeTab === 'productTypes' ? 'border-indigo-500 text-indigo-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Product types
                </button>
                <button
                    onClick={() => setActiveTab('yieldData')}
                    className={`py-2 px-4 -mb-px border-b-2 ${activeTab === 'yieldData' ? 'border-indigo-500 text-indigo-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Yield data
                </button>
                <button
                    onClick={() => setActiveTab('riskFlags')}
                    className={`py-2 px-4 -mb-px border-b-2 ${activeTab === 'riskFlags' ? 'border-indigo-500 text-indigo-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Risk flags
                </button>
            </div>

            <div className="space-y-8">
                {activeTab === 'conversionRatios' && <ConversionRatiosManager />}
                {activeTab === 'productTypes' && <ProductTypesManager />}
                {activeTab === 'yieldData' && <YieldDataManager />}
                {activeTab === 'riskFlags' && <RiskFlagsManager />}
            </div>
        </div>
    );
};


// Main App Component (renamed from App to MainApp)
const MainApp = () => {
    const [currentPage, setCurrentPage] = useState('home'); // 'home', 'calculator', 'admin'
    // eslint-disable-next-line no-unused-vars
    const { isAdmin, setIsAdmin, userId, isAuthReady, db } = useAppContext(); // Now correctly gets context

    // Initial data seeding for public collections if they are empty

        useEffect(() => {
        const seedData = async () => {
            if (!db || !isAuthReady || !userId) {
                console.log("Seed data skipped: Firebase not ready or user not authenticated.");
                return; // Ensure Firebase is ready and user is authenticated
            }

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const publicDataPath = `/artifacts/${appId}/public/data`;

            const collectionsToSeed = [
                {
                    name: 'productTypes',
                    data: [
                        { commodity: 'Cocoa', name: 'Cocoa butter' },
                        { commodity: 'Cocoa', name: 'Cocoa powder' },
                        { commodity: 'Cocoa', name: 'Cocoa liquor' },
                        { commodity: 'Coffee', name: 'Roasted coffee' },
                        { commodity: 'Coffee', name: 'Instant coffee' },
                        { commodity: 'Coffee', name: 'Coffee extract' },
                        { commodity: 'Rubber', name: 'Latex concentrate' },
                        { commodity: 'Rubber', name: 'Smoked sheets' },
                        { commodity: 'Rubber', name: 'Crepe rubber' },
                        { commodity: 'Palm Oil', name: 'Refined palm oil' },
                        { commodity: 'Palm Oil', name: 'Palm kernel oil' },
                        { commodity: 'Palm Oil', name: 'Palm olein' },
                        { commodity: 'Soy', name: 'Soy oil' },
                        { commodity: 'Soy', name: 'Soy meal' },
                        { commodity: 'Soy', name: 'Soy protein isolate' },
                    ]
                },
                {
                    name: 'conversionRatios',
                    data: [
                        { commodity: 'Cocoa', processedProduct: 'Cocoa butter', ratio: 1.2 },
                        { commodity: 'Cocoa', processedProduct: 'Cocoa powder', ratio: 1.1 },
                        { commodity: 'Cocoa', processedProduct: 'Cocoa liquor', ratio: 1.0 },
                        { commodity: 'Coffee', processedProduct: 'Roasted coffee', ratio: 1.18 }, // 1.18 kg green beans for 1 kg roasted
                        { commodity: 'Coffee', processedProduct: 'Instant coffee', ratio: 2.6 }, // 2.6 kg green beans for 1 kg instant
                        { commodity: 'Coffee', processedProduct: 'Coffee extract', ratio: 1.5 },
                        { commodity: 'Rubber', processedProduct: 'Latex concentrate', ratio: 0.6 }, // Dry rubber content often around 60%
                        { commodity: 'Rubber', processedProduct: 'Smoked sheets', ratio: 1.0 },
                        { commodity: 'Rubber', processedProduct: 'Crepe rubber', ratio: 1.0 },
                        { commodity: 'Palm Oil', processedProduct: 'Refined palm oil', ratio: 0.2 }, // Approx. 20% oil from FFB
                        { commodity: 'Palm Oil', processedProduct: 'Palm kernel oil', ratio: 0.02 }, // Approx. 2% oil from FFB
                        { commodity: 'Palm Oil', processedProduct: 'Palm olein', ratio: 1.0 }, // Olein is a fraction of palm oil
                        { commodity: 'Soy', processedProduct: 'Soy oil', ratio: 0.18 }, // Approx 18% oil from beans
                        { commodity: 'Soy', processedProduct: 'Soy meal', ratio: 0.78 }, // Approx 78% meal from beans
                        { commodity: 'Soy', processedProduct: 'Soy protein isolate', ratio: 0.05 },
                    ]
                },
                {
                    name: 'yieldData',
                    data: [
                        // Cocoa top producers (kg/ha/year)
                        { country: 'Ivory Coast', commodity: 'Cocoa', yield: 600 },
                        { country: 'Ghana', commodity: 'Cocoa', yield: 500 },
                        { country: 'Indonesia', commodity: 'Cocoa', yield: 700 },
                        { country: 'Cameroon', commodity: 'Cocoa', yield: 450 },
                        { country: 'Nigeria', commodity: 'Cocoa', yield: 400 },
                        { country: 'Brazil', commodity: 'Cocoa', yield: 800 },
                        { country: 'Ecuador', commodity: 'Cocoa', yield: 750 },

                        // Coffee top producers (kg/ha/year)
                        { country: 'Brazil', commodity: 'Coffee', yield: 1500 },
                        { country: 'Vietnam', commodity: 'Coffee', yield: 2500 },
                        { country: 'Colombia', commodity: 'Coffee', yield: 800 },
                        { country: 'Indonesia', commodity: 'Coffee', yield: 1000 },
                        { country: 'Ethiopia', commodity: 'Coffee', yield: 700 },
                        { country: 'Honduras', commodity: 'Coffee', yield: 600 },
                        { country: 'India', commodity: 'Coffee', yield: 850 },

                        // Rubber top producers (kg/ha/year)
                        { country: 'Thailand', commodity: 'Rubber', yield: 1500 },
                        { country: 'Indonesia', commodity: 'Rubber', yield: 1200 },
                        { country: 'Vietnam', commodity: 'Rubber', yield: 1100 },
                        { country: 'India', commodity: 'Rubber', yield: 1000 },
                        { country: 'China', commodity: 'Rubber', yield: 900 },
                        { country: 'Malaysia', commodity: 'Rubber', yield: 1000 },

                        // Palm Oil top producers (kg/ha/year - FFB yield, not oil)
                        { country: 'Indonesia', commodity: 'Palm Oil', yield: 4000 },
                        { country: 'Malaysia', commodity: 'Palm Oil', yield: 3800 },
                        { country: 'Thailand', commodity: 'Palm Oil', yield: 3000 },
                        { country: 'Colombia', commodity: 'Palm Oil', yield: 2800 },
                        { country: 'Nigeria', commodity: 'Palm Oil', yield: 2500 },

                        // Soy top producers (kg/ha/year)
                        { country: 'Brazil', commodity: 'Soy', yield: 3500 },
                        { country: 'USA', commodity: 'Soy', yield: 3300 },
                        { country: 'Argentina', commodity: 'Soy', yield: 3000 },
                        { country: 'China', commodity: 'Soy', yield: 2800 },
                        { country: 'India', commodity: 'Soy', yield: 2500 },
                    ]
                },
                {
                    name: 'riskFlags',
                    data: [
                        { country: 'Brazil', riskLevel: 'High', description: 'Significant deforestation risk in Amazon and Cerrado biomes.' },
                        { country: 'Indonesia', riskLevel: 'High', description: 'Palm oil expansion linked to deforestation and peatland conversion.' },
                        { country: 'Ivory Coast', riskLevel: 'Medium', description: 'Cocoa production linked to forest degradation.' },
                        { country: 'Colombia', riskLevel: 'Low', description: 'Generally lower deforestation rates, but localised issues exist.' },
                        { country: 'Vietnam', riskLevel: 'Medium', description: 'Coffee and rubber expansion and land use change concerns.' },
                        { country: 'Cameroon', riskLevel: 'Medium', description: 'Cocoa expansion and forest encroachment concerns.' },
                        { country: 'Nigeria', riskLevel: 'Medium', description: 'Palm oil and cocoa expansion linked to forest loss.' },
                        { country: 'Thailand', riskLevel: 'Low', description: 'Rubber production generally stable, but some areas face land use change pressure.' },
                        { country: 'Ethiopia', riskLevel: 'Medium', description: 'Coffee expansion in forest areas.' },
                        { country: 'Honduras', riskLevel: 'Medium', description: 'Coffee production in areas with deforestation pressure.' },
                        { country: 'India', riskLevel: 'Low', description: 'Diverse agricultural landscape, some localised deforestation for soy and coffee.' },
                        { country: 'China', riskLevel: 'Low', description: 'Rubber expansion in sensitive ecosystems.' },
                        { country: 'Argentina', riskLevel: 'High', description: 'Soy expansion linked to deforestation in Gran Chaco.' },
                        { country: 'USA', riskLevel: 'Low', description: 'Mature agricultural landscape, but sustainability practices are key.' },
                    ]
                }
            ];

            for (const collectionInfo of collectionsToSeed) {
                const colRef = collection(db, `${publicDataPath}/${collectionInfo.name}`);
                const snapshot = await getDocs(colRef);
                if (snapshot.empty) {
                    console.log(`Seeding initial data for ${collectionInfo.name}...`);
                    for (const item of collectionInfo.data) {
                        // For productTypes, use commodity + name for a more unique ID if needed, otherwise Firestore auto-generates
                        // For simplicity, let Firestore auto-generate IDs for now.
                        await addDoc(colRef, item);
                    }
                }
            }
        };

        if (db && isAuthReady && userId) {
            seedData();
        }
    }, [db, isAuthReady, userId]); // Depend on db, isAuthReady, userId to ensure Firebase is ready

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Custom scrollbar for chat history */
                .scrollbar-thin {
                    scrollbar-width: thin;
                    scrollbar-colour: #a78bfa #ede9fe; /* thumb and track colour */
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 8px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #ede9fe; /* track colour */
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-colour: #a78bfa; /* thumb colour */
                    border-radius: 10px;
                    border: 2px solid #ede9fe; /* creates padding around thumb */
                }
                `}
            </style>
            <Header currentPage={currentPage} setCurrentPage={setCurrentPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
            <main className="container mx-auto p-4 mt-4">
                {currentPage === 'home' && <HomeSection />}
                {currentPage === 'calculator' && <CalculatorSection />}
                {currentPage === 'admin' && isAdmin && <AdminDashboard />}
                {currentPage === 'admin' && !isAdmin && (
                    <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg text-center">
                        <h2 className="text-2xl font-bold mb-4">Access denied</h2>
                        <p>You must be logged in as an administrator to access this page.</p>
                    </div>
                )}
            </main>
            <footer className="bg-gray-800 text-white p-4 mt-8 text-center rounded-t-lg">
                <p>&copy; 2025 EUDR Calculator. All rights reserved.</p>
                {userId && (
                    <p className="text-sm text-gray-400 mt-2">Your User ID: {userId}</p>
                )}
            </footer>
        </div>
    );
};

// The root App component that wraps MainApp with AppProvider
const App = () => {
    return (
        <AppProvider>
            <MainApp />
        </AppProvider>
    );
};

export default App;
