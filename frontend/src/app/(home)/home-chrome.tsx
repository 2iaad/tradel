import Link from "next/link";

export function HomeNav() {
    return (
        <nav className="nav-w" theme="light">
            <div className="nav-inner">
                <Link
                    aria-current="page"
                    aria-label="homepage"
                    className="nav-logo w-inline-block w--current"
                    data-nav-logo=""
                    href="/"
                >
                    <span className="tradel-logo tradel-logo--nav" aria-label="Tradel">
                        tradel
                    </span>
                </Link>
                <div className="nav-content">
                    <div className="nav-buttons">
                        <Link className="nav-link new-button_label" data-nav-item="" href="/login">
                            Log in
                        </Link>
                        <Link className="new-button w-inline-block" data-nav-item="" href="/register">
                            <div className="new-button_label">Create account</div>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
