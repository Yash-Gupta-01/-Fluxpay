import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const TransferPage = () => {
    const [amount, setAmount] = useState('');
    const [receiverVPA, setReceiverVPA] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [senderDetails, setSenderDetails] = useState({});
    const navigate = useNavigate();

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

        if (!receiverVPA.trim()) {
            setError('Please enter receiver VPA');
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
            const response = await fetch('http://localhost:3000/api/v1/transaction/transfer', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiverVPA: receiverVPA.trim(),
                    amount: Number(amount),
                    description: description.trim()
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Transfer Money</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-foreground mb-1">Sender</label>
                        <div className="p-3 bg-muted rounded-md">
                            {senderDetails.name || 'Loading...'}
                        </div>
                    </div>

                    <form onSubmit={handleTransfer} className="space-y-4">
                        <div>
                            <label htmlFor="receiverVPA" className="block text-sm font-medium text-foreground mb-1">Receiver VPA</label>
                            <Input
                                id="receiverVPA"
                                type="text"
                                value={receiverVPA}
                                onChange={(e) => setReceiverVPA(e.target.value)}
                                placeholder="Enter receiver's VPA"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
                                Amount (₹)
                            </label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value >= 0) {
                                        setAmount(value);
                                    }
                                }}
                                placeholder="Enter amount"
                                required
                                min="1"
                                max={localStorage.getItem('userBalance')}
                                step="1"
                                onKeyDown={(e) => {
                                    if (e.key === '.') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <div className="text-sm text-muted-foreground mt-1">
                                Available balance: ₹{localStorage.getItem('userBalance') || 0}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                                Description (Optional)
                            </label>
                            <Input
                                id="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter description"
                                maxLength="255"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Processing...' : 'Send Money'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default TransferPage;
