'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client';

// Traduce errores de Supabase a español con mensajes claros
function traducirError(msg) {
  if (!msg) return 'Ocurrió un error inesperado.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Email o contraseña incorrectos.';
  if (m.includes('email not confirmed'))
    return 'Confirmá tu email antes de iniciar sesión. Revisá tu bandeja de entrada.';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Ya existe una cuenta con ese email. Iniciá sesión.';
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('unable to validate email'))
    return 'El email ingresado no es válido.';
  if (m.includes('signup is disabled'))
    return 'El registro está deshabilitado en este momento.';
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Error de conexión. Verificá tu internet e intentá de nuevo.';
  return msg;
}

function validarFormulario(mode, formData) {
  const errores = {};

  if (mode === 'signup' && !formData.name.trim()) {
    errores.name = 'El nombre es obligatorio.';
  }

  if (!formData.email.trim()) {
    errores.email = 'El email es obligatorio.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errores.email = 'Ingresá un email válido.';
  }

  if (!formData.password) {
    errores.password = 'La contraseña es obligatoria.';
  } else if (formData.password.length < 6) {
    errores.password = 'La contraseña debe tener al menos 6 caracteres.';
  }

  return errores;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function checkSession() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push('/');
    }
    checkSession();
  }, [router]);

  // Limpiar errores al cambiar de modo
  function switchMode(newMode) {
    setMode(newMode);
    setFieldErrors({});
    setError('');
    setInfo('');
    setFormData({ name: '', email: '', password: '' });
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    // Validación cliente
    const errores = validarFormulario(mode, formData);
    if (Object.keys(errores).length > 0) {
      setFieldErrors(errores);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('Error de configuración. Contactá al administrador.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: { full_name: formData.name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;

        setInfo('¡Cuenta creada! Revisá tu email para confirmarla y luego iniciá sesión.');
        switchMode('login');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (signInError) throw signInError;

      router.push('/');
    } catch (authError) {
      setError(traducirError(authError.message));
    } finally {
      setLoading(false);
    }
  };

  const inputErrorStyle = (field) => fieldErrors[field] ? {
    borderColor: '#b42318',
    background: '#fff0f0',
  } : {};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="news-tag auth-tag">HAZE ACCOUNT</span>
        <h1>{mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}</h1>
        <p className="auth-page-copy">
          {mode === 'login'
            ? 'Accedé a tu carrito guardado y continuá tu compra.'
            : 'Registrate para guardar tus productos y hacer pedidos.'}
        </p>

        <div className="auth-switcher">
          <button type="button"
            className={mode === 'login' ? 'auth-switch active' : 'auth-switch'}
            onClick={() => switchMode('login')}>
            Ingresar
          </button>
          <button type="button"
            className={mode === 'signup' ? 'auth-switch active' : 'auth-switch'}
            onClick={() => switchMode('signup')}>
            Registrarme
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {mode === 'signup' && (
            <div>
              <label>Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Tu nombre"
                style={inputErrorStyle('name')}
              />
              {fieldErrors.name && <p style={errStyle}>{fieldErrors.name}</p>}
            </div>
          )}

          <div>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="tu@email.com"
              style={inputErrorStyle('email')}
              autoComplete="email"
            />
            {fieldErrors.email && <p style={errStyle}>{fieldErrors.email}</p>}
          </div>

          <div>
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ ...inputErrorStyle('password'), paddingRight: '56px' }}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#95789b', fontSize: '0.8rem', fontWeight: '600' }}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            {fieldErrors.password && <p style={errStyle}>{fieldErrors.password}</p>}
            {mode === 'signup' && formData.password && (
              <PasswordStrength password={formData.password} />
            )}
          </div>

          {error && (
            <p className="auth-feedback auth-error">⚠ {error}</p>
            </div>
          )}
          {info && (
            <p className="auth-feedback auth-info">✓ {info}</p>
          )}

          <button type="submit" className="checkout-primary-btn" disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <Link href="/" className="auth-back-link">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const label = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'][strength];
  const color = ['', '#dc2626', '#f97316', '#eab308', '#22c55e', '#16a34a'][strength];

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength ? color : '#e5e7eb', transition: 'background 0.2s' }} />
        ))}
      </div>
      {label && <p style={{ fontSize: '0.75rem', color, margin: 0 }}>{label}</p>}
    </div>
  );
}

const errStyle = { color: '#dc2626', fontSize: '0.8rem', margin: '4px 0 0' };
