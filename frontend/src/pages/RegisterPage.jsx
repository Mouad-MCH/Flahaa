import { Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  Phone,
  Tractor,
} from "lucide-react";
import { Field, PageLoader } from "../components/ui/ui.jsx";
import { useRegisterPage } from "../hooks/useRegisterPage.js";

const RegisterPage = () => {
  const {
    loading,
    isInvitation,
    invitation,
    isInvitationLoading,
    isInvitationError,
    invitationError,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    farmName,
    setFarmName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSubmit,
  } = useRegisterPage();

  if (isInvitation && isInvitationError) {
    return (
      <main className="w-full min-h-screen flex items-center justify-center bg-paper p-4">
        <div className="bg-card rounded-card shadow-lift p-8 max-w-md w-full text-center">
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: "var(--olive-ink)" }}
          >
            Invalid invitation
          </h1>

          <p className="text-ink-2 mb-6">
            {invitationError?.response?.data?.message ||
              "This invitation is invalid, expired, or has already been used."}
          </p>

          <Link
            to="/login"
            className="text-field font-semibold hover:underline"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  if (isInvitation && isInvitationLoading) {
    return (
      <PageLoader
        title="Loading invitation"
        subtitle="Please wait a moment..."
      />
    );
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-paper p-4 relative overflow-x-hidden">
      <img
        className="absolute -top-2 -right-2 w-30 rotate-180"
        src="/icons/plante_auth.png"
      />
      <img
        className="absolute -bottom-2 -left-2 w-30 "
        src="/icons/plante_auth.png"
      />
      <div className="w-full max-w-4xl bg-card rounded-card shadow-lift overflow-hidden flex flex-col md:flex-row md:h-160">
        <div className="hidden md:block md:w-1/2 relative shrink-0">
          <img
            src="/images/auth.jpg"
            alt="Flahaa"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 mb-8">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-field-soft text-field">
              <img src="/icons/Logo.png" />
            </span>
            <span className="text-xl font-bold text-field">Flahaa</span>
          </div>

          <h1
            className="text-2xl font-bold text-olive-ink mb-1.5"
            style={{ color: "var(--olive-ink)" }}
          >
            {isInvitation ? `Welcome ${invitation?.name}` : "Create an account"}
          </h1>
          <p className="text-sm text-ink-2 mb-7">
            {isInvitation
              ? `You've been invited to join ${invitation?.farm_name ?? "Flahaa"} as ${invitation?.role ?? ""}.`
              : "Register your farm on Flahaa to manage your teams and payroll."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isInvitation && (
              <>
                <Field label="Full name">
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                    />
                    <input
                      type="text"
                      className="input"
                      style={{ paddingLeft: "2.25rem" }}
                      placeholder="Ahmed Bennani"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                </Field>

                <Field label="Email">
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                    />
                    <input
                      type="email"
                      className="input"
                      style={{ paddingLeft: "2.25rem" }}
                      placeholder="admin@flahaapro.ma"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone" hint="Optional">
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                      />
                      <input
                        type="tel"
                        className="input"
                        style={{ paddingLeft: "2.25rem" }}
                        placeholder="06 12 34 56 78"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                      />
                    </div>
                  </Field>

                  <Field label="Farm name">
                    <div className="relative">
                      <Tractor
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                      />
                      <input
                        type="text"
                        className="input"
                        style={{ paddingLeft: "2.25rem" }}
                        placeholder="Al Baraka Farm"
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        autoComplete="organization"
                      />
                    </div>
                  </Field>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Password">
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input"
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm">
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="input"
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-field hover:bg-field-hover disabled:opacity-60 text-white font-medium rounded-input py-2.5 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create my account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-2 mt-7">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-field font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
