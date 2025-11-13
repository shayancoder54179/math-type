import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AuthoringPage } from './pages/AuthoringPage';
import { StudentPage } from './pages/StudentPage';
import { MathKeyboard } from './components/shared/MathKeyboard';

function AppContent() {
  const location = useLocation();
  const isAuthoringPage = location.pathname === '/authoring';

  const handleKeyboardInsert = (text: string) => {
    // Dispatch custom event for keyboard input
    window.dispatchEvent(new CustomEvent('math-keyboard-insert', { detail: { text } }));
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/authoring" element={<AuthoringPage />} />
            <Route path="/student" element={<StudentPage />} />
          </Routes>
        </div>
        {isAuthoringPage && <MathKeyboard onInsert={handleKeyboardInsert} />}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
