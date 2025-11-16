
import { useState, useEffect } from 'react';
import Input from '../../components/base/Input';
import Button from '../../components/base/Button';


export default function AdminWalletCalculator({
    onCredit,
    loading = false,
    buttonText = 'Credit Wallet',
    buttonColor = 'primary'
}) {
    const [clientAmount, setClientAmount] = useState('');
    const [percentage, setPercentage] = useState('');
    const [finalAmount, setFinalAmount] = useState(0);

    useEffect(() => {
        const amount = parseFloat(clientAmount) || 0;
        const percent = parseFloat(percentage) || 0;
        const calculated = (amount * percent) / 100;
        setFinalAmount(calculated + amount);
    }, [clientAmount, percentage]);

    const handleCredit = () => {
        const amount = parseFloat(clientAmount) || 0;
        const percent = parseFloat(percentage) || 0;
        if (amount > 0 && percent >= 0) {
            onCredit(amount, percent, finalAmount);
        }
    };

    const isValid = parseFloat(clientAmount) > 0 && parseFloat(percentage) > 0;

    return (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Wallet Credit Calculator</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    type="number"
                    label="Client Paid Amount"
                    value={clientAmount}
                    onChange={(e) => setClientAmount(e.target.value)}
                    placeholder="Enter amount"
                    icon="ri-money-rupee-circle-line"
                />

                <Input
                    type="number"
                    label="Commission Percentage"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="Enter percentage"
                    icon="ri-percent-line"
                />
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Final Credit Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                        ₹{finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                </div>
                {clientAmount && percentage && (
                    <p className="text-xs text-gray-500 mt-1">
                        ₹{parseFloat(clientAmount).toLocaleString('en-IN')} × {percentage}% = ₹{finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                )}
            </div>

            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        setClientAmount('');
                        setPercentage('8');
                    }}
                >
                    Reset
                </Button>
                <Button
                    type="submit"
                    onClick={handleCredit}
                    disabled={loading || !clientAmount || !percentage}
                    className={buttonColor === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                >
                    {loading ? (
                        <>
                            <i className="ri-loader-4-line animate-spin mr-2 w-4 h-4 flex items-center justify-center"></i>
                            Processing...
                        </>
                    ) : (
                        <>
                            <i className="ri-wallet-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                            {buttonText}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
