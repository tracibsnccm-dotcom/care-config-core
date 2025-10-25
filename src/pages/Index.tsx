import { NavLink } from "react-router-dom";

const Index = () => {
  return (
    <section className="bg-gray-50 py-10 min-h-screen">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#0f2a6a]">Reconcile C.A.R.E.</h1>
        <p className="text-gray-700 text-base mt-1">
          A secure platform connecting attorneys, clients, and clinical insight.
        </p>
        {/* Divider line */}
        <div className="mt-4 mx-auto w-24 border-b-2 border-gray-300 rounded-full"></div>
      </header>

      <div className="flex flex-col items-center gap-5 mt-8 max-w-md mx-auto text-center">
        <div>
          <NavLink
            to="/client-intake"
            className="block w-full bg-[#00695C] text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#00695C]"
          >
            Start Your Intake
          </NavLink>
          <p className="mt-2 text-sm text-gray-900 font-semibold">
            Begin your case. Complete your intake form and consent securely.
          </p>
        </div>

        <div>
          <NavLink
            to="/client-portal"
            className="block w-full bg-[#0f2a6a] text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#0f2a6a]"
          >
            Client Portal
          </NavLink>
          <p className="mt-2 text-sm text-gray-900 font-semibold">
            Return to update your information or check your case progress.
          </p>
        </div>

        <div>
          <NavLink
            to="/attorney-portal"
            className="block w-full bg-[#b85c00] text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#b85c00]"
          >
            Attorney Portal
          </NavLink>
          <p className="mt-2 text-sm text-gray-900 font-semibold">
            Access client files, case updates, and provider routing.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Index;
