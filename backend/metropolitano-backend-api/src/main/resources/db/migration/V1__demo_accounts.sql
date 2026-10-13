CREATE TABLE demo_account (
  id VARCHAR(36) PRIMARY KEY,
  login_phone VARCHAR(9) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(9) NOT NULL,
  dni VARCHAR(8) NOT NULL,
  email VARCHAR(254) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  notifications BOOLEAN NOT NULL,
  alerts_read BOOLEAN NOT NULL,
  version BIGINT NOT NULL
);
CREATE TABLE demo_recharge (
  id VARCHAR(36) PRIMARY KEY,
  account_id VARCHAR(36) NOT NULL,
  request_key VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(20) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_recharge_account FOREIGN KEY (account_id) REFERENCES demo_account(id),
  CONSTRAINT uq_recharge_request UNIQUE(account_id, request_key)
);
