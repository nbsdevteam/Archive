import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDataTheme } from './core/data/redux/themeSettingSlice';

const TestTheme: React.FC = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: any) => state.themeSetting.dataTheme);
  const [themeStatus, setThemeStatus] = useState<string>('');

  useEffect(() => {
    // Check if data-theme attribute is set on document element
    const dataTheme = document.documentElement.getAttribute('data-theme');
    setThemeStatus(`Current theme: ${currentTheme}, data-theme attribute: ${dataTheme || 'not set'}`);
  }, [currentTheme]);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    dispatch(setDataTheme(newTheme));
  };

  const checkThemeAttribute = () => {
    const dataTheme = document.documentElement.getAttribute('data-theme');
    setThemeStatus(`Current theme: ${currentTheme}, data-theme attribute: ${dataTheme || 'not set'}`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Theme Test Component</h2>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Status:</strong> {themeStatus}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={toggleTheme}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: currentTheme === 'dark' ? '#333' : '#fff',
            color: currentTheme === 'dark' ? '#fff' : '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Toggle Theme ({currentTheme})
        </button>
        
        <button 
          onClick={checkThemeAttribute}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Theme Attribute
        </button>
      </div>

      <div style={{ 
        padding: '20px', 
        border: '1px solid #ccc', 
        borderRadius: '4px',
        backgroundColor: currentTheme === 'dark' ? '#333' : '#fff',
        color: currentTheme === 'dark' ? '#fff' : '#333'
      }}>
        <h3>Test Content</h3>
        <p>This content should change appearance based on the theme.</p>
        <p>Current theme state: <strong>{currentTheme}</strong></p>
        <p>data-theme attribute: <strong>{document.documentElement.getAttribute('data-theme') || 'not set'}</strong></p>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <h4>Debug Information:</h4>
        <ul>
          <li>Redux theme state: {currentTheme}</li>
          <li>Document data-theme: {document.documentElement.getAttribute('data-theme') || 'not set'}</li>
          <li>LocalStorage dataTheme: {localStorage.getItem('dataTheme') || 'not set'}</li>
        </ul>
      </div>
    </div>
  );
};

export default TestTheme; 