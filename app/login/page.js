'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    async function checkSession() {
      if (!supabase) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push('/');
      }
    }

    checkSession();
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!isSupabaseConfigured || !supabase) {
      setError('Faltan variables de entorno de Supabase.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;

        setInfo(
          'Cuenta creada. Si tu proyecto pide confirmación de email, revisá tu correo antes de iniciar sesión.'
        );
        setMode('login');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      router.push('/');
    } catch (authError) {
      setError(authError.message || 'No se pudo completar la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="news-tag auth-tag">HAZE ACCOUNT</span>
        <h1>{mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}</h1>
        <p className="auth-page-copy">
          {mode === 'login'
            ? 'Accedé a tu carrito guardado y continuá tu compra.'
            : 'Registrate para guardar tus productos y simular pedidos con tu propia cuenta.'}
        </p>

        <div className="auth-switcher">
          <button
            type="button"
            className={mode === 'login' ? 'auth-switch active' : 'auth-switch'}
            onClick={() => setMode('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'auth-switch active' : 'auth-switch'}
            onClick={() => setMode('signup')}
          >
            Registrarme
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <>
              <label>Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Tu nombre"
              />
            </>
          ) : null}

          <label>Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="tu@email.com"
          />

          <label>Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Mínimo 6 caracteres"
          />

          {error ? <p className="auth-feedback auth-error">{error}</p> : null}
          {info ? <p className="auth-feedback auth-info">{info}</p> : null}

          <button type="submit" className="checkout-primary-btn" disabled={loading}>
            {loading
              ? 'Procesando...'
              : mode === 'login'
                ? 'Ingresar'
                : 'Crear cuenta'}
          </button>
        </form>

        <Link href="/" className="auth-back-link">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
