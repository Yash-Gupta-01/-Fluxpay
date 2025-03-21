import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TransferPage = () => {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [senderDetails, setSenderDetails] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const receiverDetails = location.state?.user;

    useEffect(() => {
        fetchSenderDetails();
    }, []);

    const fetchSenderDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/v1/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setSenderDetails(data);
        } catch (error) {
            console.error('Error fetching sender details:', error);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Input validation
        if (!amount || amount <= 0) {
            setError('Please enter a valid amount');
            setLoading(false);
            return;
        }

        if (!receiverDetails?._id) {
            setError('Invalid receiver selected');
            setLoading(false);
            return;
        }

        // Check if amount is greater than sender's balance
        const senderBalance = parseFloat(localStorage.getItem('userBalance'));
        if (Number(amount) > senderBalance) {
            setError('Insufficient balance');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/v1/account/transfer', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: receiverDetails._id,
                    amount: Number(amount)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Transfer failed');
            }

            // Update local balance
            const currentBalance = localStorage.getItem('userBalance');
            localStorage.setItem('userBalance', Number(currentBalance) - Number(amount));

            // Show success notification
            alert('Transfer successful!');
            navigate('/dashboard', { replace: true });
            
        } catch (error) {
            setError(error.message || 'Transaction failed');
            console.error('Transfer error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-md p-6">
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center mb-6">Transfer Money</h2>
                
                <div className="mb-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                        <div className="p-3 bg-gray-50 rounded-md">
                            {senderDetails.name || 'Loading...'}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receiver</label>
                        <div className="p-3 bg-gray-50 rounded-md">
                            {receiverDetails ? `${receiverDetails.firstName} ${receiverDetails.lastName}` : 'Not selected'}
                        </div>
                    </div>

                    <form onSubmit={handleTransfer}>
                        <div className="mb-4">
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value >= 0) {  // Prevent negative numbers
                                        setAmount(value);
                                    }
                                }}
                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Enter amount"
                                required
                                min="1"
                                max={localStorage.getItem('userBalance')} // Add maximum limit
                                step="1" // Allow only whole numbers
                                onKeyDown={(e) => {
                                    // Prevent decimal point
                                    if (e.key === '.') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <div className="text-sm text-gray-500 mt-1">
                                Available balance: ₹{localStorage.getItem('userBalance') || 0}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {loading ? 'Processing...' : 'Send Money'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TransferPage;