const App = () => {
  const handleClick = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/fill-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to start form filling process");
      }

      alert("Started form filling");
    } catch (error) {
      console.error("Error:", error);
      alert("Error starting form filling");
    }
  };
  return (
    <div>
      <h1>Pipeline</h1>
      <h2>Fill out job applications in seconds!</h2>
      <button onClick={handleClick}>Run</button>
    </div>
  );
};

export default App;
