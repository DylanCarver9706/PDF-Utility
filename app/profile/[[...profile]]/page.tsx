import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="flex justify-center mt-[5vh]">
        <UserProfile />
    </div>
  );
} 