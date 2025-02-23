interface UserData {
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

interface FileConfig {
  resume: string;
  coverLetter: string;
}

const userData: UserData = {
  name: "Patrick Star",
  email: "patrickstar@gmail.com",
  phone: "4168291137",
  degree: "Bachelor of Science",
  program: "Computer Science",
  experience: ["Software Engineer at Google, Data Engineer at Meta"],
  skills: ["C", "C++", "JavaScript", "TypeScript", "Python"],
  location: "Bikini Bottom, Pacific Ocean",
  address: "30 Bikini Bottom Way",
  postal: "L16471",
  website: "patrick.com",
  gender: "Male",
  ethnicity: "Starfish",
  sex: "Heterosexual",
  religion: "Prefer not to say",
  age: "26",
  disability: "No",
  pronouns: "He/him/his",
};

const fileConfig: FileConfig = {
  resume: "resume.pdf",
  coverLetter: "cover-letter.pdf",
};

export { userData, fileConfig };
