import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AlertCircle, RefreshCw, X } from 'lucide-react'

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    return (
        <div className="Container">
            {(offlineReady || needRefresh) && (
                <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-white dark:bg-slate-900 border border-slate-700 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 max-w-sm w-full">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                {offlineReady ? 'App ready to work offline' : 'New content available'}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                {offlineReady
                                    ? 'Annadata Saathi is cached and ready to use without internet.'
                                    : 'A new version of the app is available. Click refresh to update.'}
                            </p>

                            <div className="flex gap-2">
                                {needRefresh && (
                                    <button
                                        onClick={() => updateServiceWorker(true)}
                                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                )}
                                <button
                                    onClick={close}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                        <button onClick={close} className="text-slate-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReloadPrompt
