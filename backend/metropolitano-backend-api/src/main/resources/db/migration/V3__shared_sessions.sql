CREATE TABLE demo_session_guard (id INTEGER PRIMARY KEY);
INSERT INTO demo_session_guard (id) VALUES (1);
CREATE TABLE demo_session (
    token_hash VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL REFERENCES demo_account(id),
    expires_at BIGINT NOT NULL
);
CREATE INDEX ix_demo_session_expiry ON demo_session(expires_at);
CREATE INDEX ix_demo_recharge_recent ON demo_recharge(account_id, created_at);
