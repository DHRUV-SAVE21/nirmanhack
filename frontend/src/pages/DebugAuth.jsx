import React from 'react';

const DebugAuth = () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    let user = null;
    let parseError = null;
    
    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        parseError = e.message;
    }
    
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Auth Debug Info</h1>
                
                <div className="bg-slate-800 rounded-lg p-6 mb-4">
                    <h2 className="text-xl font-bold mb-4">Token</h2>
                    <pre className="bg-white dark:bg-slate-900 p-4 rounded overflow-auto">
                        {token || 'No token found'}
                    </pre>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-6 mb-4">
                    <h2 className="text-xl font-bold mb-4">User Data (Raw)</h2>
                    <pre className="bg-white dark:bg-slate-900 p-4 rounded overflow-auto">
                        {userStr || 'No user data found'}
                    </pre>
                </div>
                
                {parseError && (
                    <div className="bg-red-900 rounded-lg p-6 mb-4">
                        <h2 className="text-xl font-bold mb-4">Parse Error</h2>
                        <pre className="bg-red-950 p-4 rounded overflow-auto">
                            {parseError}
                        </pre>
                    </div>
                )}
                
                {user && (
                    <div className="bg-slate-800 rounded-lg p-6 mb-4">
                        <h2 className="text-xl font-bold mb-4">User Object (Parsed)</h2>
                        <pre className="bg-white dark:bg-slate-900 p-4 rounded overflow-auto">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                        
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-slate-600 dark:text-slate-400">Role:</p>
                                <p className="text-2xl font-bold">{user.role || 'undefined'}</p>
                            </div>
                            <div>
                                <p className="text-slate-600 dark:text-slate-400">Role (lowercase):</p>
                                <p className="text-2xl font-bold">{user.role?.toLowerCase() || 'undefined'}</p>
                            </div>
                            <div>
                                <p className="text-slate-600 dark:text-slate-400">Email:</p>
                                <p className="text-lg">{user.email || 'undefined'}</p>
                            </div>
                            <div>
                                <p className="text-slate-600 dark:text-slate-400">Name:</p>
                                <p className="text-lg">{user.full_name || user.name || 'undefined'}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="bg-slate-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Actions</h2>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/auth';
                            }}
                            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded"
                        >
                            Clear & Logout
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
                        >
                            Refresh
                        </button>
                        <a 
                            href="/admin"
                            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded inline-block"
                        >
                            Try /admin
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugAuth;
