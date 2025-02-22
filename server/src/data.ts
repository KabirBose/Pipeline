interface User {
  name: string;
  email: string;
  phone: string;
  degree: string;
  program: string;
  experience: string[];
  skills: string[];
  location: string;
  address: string;
  postal: string;
  website: string;
  gender: string;
  ethnicity: string;
  sex: string;
  religion: string;
  age: string;
  disability: string;
  pronouns: string;
}

interface FileInfo {
  resume: string;
  coverLetter: string;
}

const userData: User = {
  name: "Kabir Bose",
  email: "kabirbose04@gmail.com",
  phone: "4166253954",
  degree: "Bachelor of Technology",
  program: "Networking & IT Security",
  experience: ["Network Engineering Intern at CBC"],
  skills: ["C", "C++", "JavaScript", "TypeScript", "Python"],
  location: "Toronto, Ontario, Canada",
  address: "19 Brisbourne Grove",
  postal: "M1B1P2",
  website: "kabirbose.vercel.app",
  gender: "Male",
  ethnicity: "South Asian",
  sex: "Heterosexual",
  religion: "Prefer not to say",
  age: "21",
  disability: "No",
  pronouns: "He/him/his",
};

const fileConfig: FileInfo = {
  resume: "resume.pdf",
  coverLetter: "cover-letter.pdf",
};

export { userData, fileConfig };
