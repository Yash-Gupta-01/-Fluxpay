import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:3000/api/v1/transaction/history', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();
                if (data.transactions) {
                    setTransactions(data.transactions);
                }
            } catch (error) {
                setError(error.message);
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="text-center p-6">
                        <div className="text-destructive mb-4">
                            {error}
                        </div>
                        <Button asChild>
                            <Link to="/dashboard">Return to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" asChild>
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
                    <div></div> {/* Spacer */}
                </div>

                {loading ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2">Loading transactions...</span>
                        </CardContent>
                    </Card>
                ) : transactions.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No transactions found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((transaction) => (
                            <Card key={transaction.transactionId}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${
                                                transaction.type === 'credit'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                            }`}>
                                                {transaction.type === 'credit' ? (
                                                    <TrendingUp className="h-5 w-5" />
                                                ) : (
                                                    <TrendingDown className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'}>
                                                    {transaction.type}
                                                </Badge>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {transaction.description || 'No description'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-semibold ${
                                                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(transaction.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;
