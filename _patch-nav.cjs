// Patch App.tsx to add URL hash navigation persistence
const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const navSyncCode = `
  // Sync URL hash when activeItem changes
  useEffect(() => {
    const newHash = navToHash[activeItem] || 'home';
    if (window.location.hash !== \`#\${newHash}\`) {
      window.history.pushState(null, '', \`#\${newHash}\`);
    }
  }, [activeItem]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveItem(getNavFromHash());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

`;

const marker = '  const handleActionComplete = (id: string) => {';
if (code.includes('Sync URL hash when activeItem')) {
  console.log('URL sync already exists, skipping');
} else if (code.includes(marker)) {
  code = code.replace(marker, navSyncCode + marker);
  fs.writeFileSync('App.tsx', code, 'utf8');
  console.log('URL navigation sync added successfully');
} else {
  console.log('Marker not found');
}
