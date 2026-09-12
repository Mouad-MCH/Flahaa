import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { getRegistrationTokenInfo } from "../services/registrationTokenService.js";
import { usePostAuthRedirect } from "./usePostAuthRedirect.js";

export function useRegisterPage() {
  const { register, loading } = useAuthStore();
  const redirectAfterAuth = usePostAuthRedirect();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const isInvitation = Boolean(token);

  const {
    data: invitation,
    isLoading: isInvitationLoading,
    isError: isInvitationError,
    error: invitationError,
  } = useQuery({
    queryKey: ["registration-token", token],
    queryFn: () => getRegistrationTokenInfo(token),
    enabled: isInvitation,
    retry: false,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [farmName, setFarmName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please enter a password");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    let payload;

    if (isInvitation) {
      payload = {
        token,
        password,
        confirmPassword,
      };
    } else {
      if (!name || !email || !farmName) {
        toast.error("Please fill in all required fields");
        return;
      }

      payload = {
        name,
        email,
        phone: phone || undefined,
        password,
        confirmPassword,
        role: "admin",
        farm_name: farmName,
      };
    }

    const result = await register(payload);

    if (result.success) {
      toast.success("Account created successfully");
      redirectAfterAuth(useAuthStore.getState().user);
    } else {
      toast.error(result.error);
    }
  };

  return {
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
  };
}
