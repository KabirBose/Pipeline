const App = () => {
  const runPuppeteerScript = async () => {
    try {
      const response = await fetch("http://localhost:5001/run-script");
      const data = await response.json();
      if (data.success) {
      } else {
        console.error("Failed to run Puppeteer script.");
      }
    } catch (error) {
      console.error("Error fetching script:", error);
    }
  };

  return (
    <div>
      <h1>Pipeline</h1>
      <h2>Fill out job applications in seconds!</h2>
      <button onClick={runPuppeteerScript}>Run</button>
    </div>
  );
};

export default App;
