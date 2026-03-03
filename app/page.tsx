import ImageUploader from "./components/ImageUploader/ImageUploader";
import Navbar from "./components/Navbar/Navbar";
import UploadForm from "./components/UploadForm/UploadForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
    
      {/* <ImageUploader /> */}
      <UploadForm />
    </div>
  );
}
