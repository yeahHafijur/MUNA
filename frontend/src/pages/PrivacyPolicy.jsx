import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <Link to="/" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 'bold', marginBottom: '20px', display: 'inline-block' }}>
                &larr; Back to Home
            </Link>
            
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Privacy Policy for MUNA</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>Last updated: {new Date().toLocaleDateString()}</p>

            <section style={{ marginBottom: '30px' }}>
                <h2>1. Introduction</h2>
                <p>
                    Welcome to MUNA. We respect your privacy and are committed to protecting your personal data. 
                    This privacy policy will inform you as to how we look after your personal data when you visit our website or use our app, 
                    and tell you about your privacy rights.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>2. The Data We Collect About You</h2>
                <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                <ul>
                    <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier, and profile picture (via Google Login).</li>
                    <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                    <li><strong>Location Data:</strong> includes GPS location data used to calculate delivery distance and find nearby shops.</li>
                    <li><strong>Transaction Data:</strong> includes details about orders you have placed with vendors.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>3. How We Use Your Personal Data</h2>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul>
                    <li>To register you as a new user or vendor.</li>
                    <li>To process and deliver your orders.</li>
                    <li>To manage our relationship with you.</li>
                    <li>To show you nearby shops based on your location.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>4. Third-Party Services</h2>
                <p>
                    We use third-party services like Google for authentication (Google Sign-In). 
                    These third parties have their own privacy policies addressing how they use your information.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>5. Data Security & Retention</h2>
                <p>
                    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way.
                    We will only retain your personal data for as long as reasonably necessary to fulfil the purposes we collected it for.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>6. Your Legal Rights</h2>
                <p>
                    Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, or erasure of your personal data.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>7. Contact Us</h2>
                <p>
                    If you have any questions about this privacy policy or our privacy practices, please contact us at our registered email address.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
