import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/stores/useToastStore';
import { ToastHost } from '@/components/ToastHost';
import { TermsDialog } from '@/components/TermsDialog';
import { confirmPasswordReset, requestPasswordReset } from '@/utils/api';

type View = 'login' | 'register' | 'forgot';

/** 备案号（构建期注入，不入库）：未配置时不渲染该行 */
const BEIAN = import.meta.env.VITE_ICP_BEIAN?.trim();

/* ── 图标（16px 灰，输入框左侧） ── */
const MailIcon = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const LockIcon = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── 带图标输入框 ── */
function IconInput({ icon, placeholder, type = 'text', value, onChange }: {
  icon: ReactNode; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub">{icon}</span>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-9 pr-3 rounded-md border border-line bg-white text-sm text-text-main placeholder:text-text-sub focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

/* ── 注册态：行内 label 输入框 ── */
function InlineInput({ label, placeholder, type = 'text', value, onChange }: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-sm text-text-main flex-shrink-0">{label}</span>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-10 px-3 rounded-md border border-line bg-white text-sm text-text-main placeholder:text-text-sub focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

const inputCls =
  'h-4 w-4 accent-primary cursor-pointer';

export default function LoginPage() {
  const [view, setView] = useState<View>('login');
  const [userName, setUserName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true); // 仅视觉，不实现自动登录
  const [gender, setGender] = useState<'male' | 'female'>('male'); // 仅 UI，不上送
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [email, setEmail] = useState('');
  // 服务条款弹窗（注册勾选处与页脚共用）
  const [termsOpen, setTermsOpen] = useState(false);
  // 找回密码：request=填用户名发验证码；confirm=填验证码+新密码
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPassword2, setResetPassword2] = useState('');
  const [resetHint, setResetHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, register } = useAuthStore();

  const switchView = (v: View) => {
    setView(v);
    setError('');
    if (v !== 'forgot') {
      setResetStep('request');
      setResetCode('');
      setResetPassword('');
      setResetPassword2('');
      setResetHint('');
    }
  };

  /** 找回密码第一步：请求验证码（发到账号已绑定邮箱） */
  const handleRequestReset = async () => {
    if (!userName.trim()) {
      setError('请输入用户名');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await requestPasswordReset(userName.trim());
      setResetHint(res.message || '验证码已发送，请查收邮件');
      setResetStep('confirm');
    } catch (err: any) {
      setError(err.message || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  /** 找回密码第二步：校验验证码并改密 */
  const handleConfirmReset = async () => {
    if (!resetCode.trim()) {
      setError('请输入验证码');
      return;
    }
    if (resetPassword.length < 6) {
      setError('新密码至少 6 位');
      return;
    }
    if (resetPassword !== resetPassword2) {
      setError('两次输入的新密码不一致');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await confirmPasswordReset(userName.trim(), resetCode.trim(), resetPassword);
      if (res.code !== 0) {
        setError(res.message || '重置失败');
        return;
      }
      toast(res.message || '密码已重置，请用新密码登录');
      switchView('login');
      setPassword('');
    } catch (err: any) {
      setError(err.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(userName.trim(), password);
      navigate('/chat', { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    if (confirmPassword !== password) {
      setError('两次输入的密码不一致');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(userName.trim(), nickname.trim() || userName.trim(), password, undefined, email.trim());
      navigate('/chat', { replace: true });
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const passwordTooShort = password.length > 0 && password.length < 6;
  const registerDisabled = loading || password.length < 6 || confirmPassword !== password;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{ backgroundColor: '#eef0f4', backgroundImage: 'radial-gradient(#d9dce3 1px, transparent 1px)', backgroundSize: '16px 16px' }}
    >
      <div className="w-full max-w-[360px]">
        {/* Logo 块 */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-primary" fill="currentColor">
              <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.1.9 4 2.3 5.5-.2 1.2-.8 2.6-1.6 3.5-.2.2 0 .6.3.6 1.9-.2 3.6-1 4.7-1.8 1.3.5 2.8.8 4.3.8 5.5 0 10-3.9 10-8.6S17.5 3 12 3z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="italic font-extrabold text-2xl text-primary">Pomelo Chat</span>
          </div>
          <span className="mt-1.5 px-2 py-0.5 rounded-sm bg-warn text-white text-xs">Web 版</span>
        </div>

        {/* 登录态 */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <IconInput icon={MailIcon} placeholder="用户名或ID" value={userName} onChange={setUserName} />
            <IconInput icon={LockIcon} placeholder="密码" type="password" value={password} onChange={setPassword} />
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-1.5 text-sm text-text-main cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className={inputCls}
                />
                记住密码
              </label>
              <button
                type="button"
                onClick={() => switchView('forgot')}
                className="text-sm text-accent hover:underline cursor-pointer"
              >
                忘记密码?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? '登录中...' : '登录'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-center text-sm text-text-sub pt-1">
              没有帐号？{' '}
              <button
                type="button"
                onClick={() => switchView('register')}
                className="text-accent hover:underline cursor-pointer"
              >
                注册
              </button>
            </p>
          </form>
        )}

        {/* 注册态 */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <InlineInput label="用户名：" placeholder="请输入用户名" value={userName} onChange={setUserName} />
            <InlineInput label="昵称：" placeholder="请输入昵称" value={nickname} onChange={setNickname} />
            <div>
              <InlineInput label="密码：" placeholder="请输入密码" type="password" value={password} onChange={setPassword} />
              {passwordTooShort && <p className="text-danger text-xs mt-1 ml-16">* 密码长度最少6位!</p>}
            </div>
            <InlineInput label="确认密码：" placeholder="请再次输入密码" type="password" value={confirmPassword} onChange={setConfirmPassword} />
            <InlineInput label="邮箱：" placeholder="选填，用于找回密码" type="email" value={email} onChange={setEmail} />
            <div className="flex items-center gap-4 pl-16">
              <span className="text-sm text-text-main">性别：</span>
              <label className="flex items-center gap-1.5 text-sm text-text-main cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                  className={inputCls}
                />
                男
              </label>
              <label className="flex items-center gap-1.5 text-sm text-text-main cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                  className={inputCls}
                />
                女
              </label>
            </div>
            <div className="pl-16">
              <label className="flex items-center gap-1.5 text-sm text-text-main cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className={inputCls}
                />
                我已阅读并接受{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTermsOpen(true);
                  }}
                  className="text-accent hover:underline cursor-pointer"
                >
                  服务条款
                </button>
              </label>
            </div>
            <button
              type="submit"
              disabled={registerDisabled}
              className="w-full h-10 rounded-md bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? '注册中...' : '注册'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-center text-sm text-text-sub pt-1">
              已有帐号？{' '}
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-accent hover:underline cursor-pointer"
              >
                直接登录
              </button>
            </p>
          </form>
        )}

        {/* 忘记密码态：两步（发验证码 → 填验证码 + 新密码） */}
        {view === 'forgot' && resetStep === 'request' && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-text-sub tracking-wider">FIND YOUR ACCOUNT</h2>
            <IconInput icon={MailIcon} placeholder="请输入用户名" value={userName} onChange={setUserName} />
            <p className="text-xs text-text-sub leading-5">
              输入用户名，我们会向该账号已绑定的邮箱发送 6 位验证码。
              <br />
              未绑定邮箱？请先登录后在「设置 → 绑定邮箱」中补全。
            </p>
            <button
              type="button"
              onClick={handleRequestReset}
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-center text-sm text-text-sub pt-1">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-accent hover:underline cursor-pointer"
              >
                返回登录界面
              </button>
            </p>
          </div>
        )}

        {view === 'forgot' && resetStep === 'confirm' && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-text-sub tracking-wider">RESET PASSWORD</h2>
            {resetHint && <p className="text-xs text-accent leading-5">{resetHint}</p>}
            <InlineInput label="验证码：" placeholder="邮件中的 6 位数字" value={resetCode} onChange={setResetCode} />
            <InlineInput label="新密码：" placeholder="至少 6 位" type="password" value={resetPassword} onChange={setResetPassword} />
            <InlineInput label="确认新密码：" placeholder="请再次输入新密码" type="password" value={resetPassword2} onChange={setResetPassword2} />
            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '重置中...' : '重置密码'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-center text-sm text-text-sub pt-1 space-x-4">
              <button
                type="button"
                onClick={() => { setResetStep('request'); setError(''); }}
                className="text-accent hover:underline cursor-pointer"
              >
                重新发送
              </button>
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-accent hover:underline cursor-pointer"
              >
                返回登录界面
              </button>
            </p>
          </div>
        )}
      </div>

      {/* 底部提示、版权与备案号（备案号来自构建期环境变量，须保留跳转工信部的链接） */}
      <div className="absolute bottom-4 inset-x-0 text-center text-xs text-text-sub space-y-1">
        <p>确保使用 Chrome、FireFox、Safari、Edge 等新式浏览器，以便获得更好地体验。</p>
        <p>
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-accent hover:underline cursor-pointer"
          >
            服务条款
          </button>
          <span className="mx-1.5">·</span>
          © 2026 Pomelo Chat
          {BEIAN && (
            <>
              <span className="mx-1.5">·</span>
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {BEIAN}
              </a>
            </>
          )}
        </p>
      </div>

      {/* 服务条款弹窗（登录页注册勾选处 / 页脚入口共用） */}
      {termsOpen && <TermsDialog onClose={() => setTermsOpen(false)} />}

      <ToastHost />
    </div>
  );
}
