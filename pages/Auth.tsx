import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, Loader2, Sparkles, UserPlus, LogIn } from 'lucide-react';

export function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Confirme seu e-mail para ativar sua conta!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || 'Erro na autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fffafb] flex items-center justify-center p-4">
            {/* Background patterns */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-100 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative">
                <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,180,190,0.2)] border border-white/50 relative overflow-hidden">
                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500 rounded-2xl shadow-lg shadow-rose-200 mb-6 rotate-3">
                            <Sparkles className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">
                            Studio <span className="text-rose-500 italic">Luzi</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] mt-2">SISTEMA DE GESTÃO</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white/50 border border-slate-100 rounded-2xl outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50/50 transition-all font-medium"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white/50 border border-slate-100 rounded-2xl outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-500 shrink-0">
                                    <span className="font-bold text-lg">!</span>
                                </div>
                                <p className="text-xs text-rose-600 font-medium leading-tight">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-950 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-rose-600 hover:shadow-rose-100 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isSignUp ? (
                                <>
                                    <UserPlus size={18} />
                                    Criar Conta
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Entrar no Sistema
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                        >
                            {isSignUp ? 'Já tenho uma conta' : 'Ainda não tenho conta'}
                        </button>
                    </div>
                </div>

                {/* Support lines */}
                <p className="text-center mt-8 text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                    Studio Luzi &copy; 2024 • Gestão de Alta Performance
                </p>
            </div>
        </div>
    );
}
