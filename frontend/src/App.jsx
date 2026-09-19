function AppBootScreen() {
    return (
        <main className="app-boot" aria-label="Opening FieldOps" role="status">
            <div className="app-boot-brand">
                <span className="brand-mark">F</span>
                <strong>FieldOps</strong>
            </div>
            <div className="app-boot-progress" aria-hidden="true">
                <span />
            </div>
        </main>
    );
}

export default function App() {
    return <AppBootScreen />;
}