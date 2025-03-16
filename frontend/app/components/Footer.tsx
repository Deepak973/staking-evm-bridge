export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold">Stake IT</h2>
            <p className="text-gray-400">
              Secure Cross-Chain & Staking Solution
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <div className="space-x-4 mb-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400"
              >
                GitHub
              </a>
              <a
                href="https://docs.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400"
              >
                Docs
              </a>
            </div>
            <p className="text-sm text-gray-400">
              © {currentYear} Staking It. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
