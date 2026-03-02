import UserSidebar from "./UserSidebar";
import UserNavbar from "./UserNavbar";
import "../styles/user.css";

function UserLayout({ children }) {
  return (
    <div className="user-container">
      <UserSidebar />

      <div className="user-main">
        <UserNavbar />
        <div className="user-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default UserLayout;