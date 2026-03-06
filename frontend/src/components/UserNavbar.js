function UserNavbar({ onMenuClick }) {
  const name = localStorage.getItem("user_name") || "User";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="user-navbar">
      <div className="user-navbar-left">
        <button
          className="user-hamburger"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h3>Patient Portal</h3>
      </div>

      <div className="user-navbar-badge">
        <div className="user-navbar-avatar">{initials}</div>
        <span className="badge-name">{name}</span>
      </div>
    </div>
  );
}

export default UserNavbar;
