import { useState } from "react";

const App = () => {
  const [title, setTitle] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      const response = await fetch("http://localhost:3000/scrape");
      const data = await response.json();
      setTitle(data.title);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div>
      <h1>Pipeline</h1>
      <h2>Fill out job applications in seconds!</h2>
      <button onClick={handleClick}>Run</button>
      {title && <h1>Scraped Title: {title}</h1>}
    </div>
  );
};

export default App;
