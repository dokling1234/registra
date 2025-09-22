import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const SplashScreen = ({ duration = 1500, message, autoNavigate = true, defaultTo }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!autoNavigate) return;
    const qsTarget = new URLSearchParams(location.search).get("to");
    const stateTarget = location.state?.to;
    const computedDefault = defaultTo || (location.pathname === "/" ? "/login" : null);
    const target = stateTarget || qsTarget || computedDefault;
    const timer = setTimeout(() => {
      if (target) {
        navigate(target, { replace: true });
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [autoNavigate, defaultTo, duration, location.pathname, location.search, location.state, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      <div className="flex flex-col items-center gap-6">
        {assets?.logo ? (
          <img src={assets.logo} alt="Logo" className="w-28 sm:w-32" />
        ) : null}
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-700 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-blue-800 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-indigo-900 animate-bounce"></span>
        </div>
        {message ? <p className="text-slate-700 text-sm">{message}</p> : null}
      </div>
    </div>
  );
};

export default SplashScreen;


