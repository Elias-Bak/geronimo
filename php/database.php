<?php

class database {

    var $local_hostname = "localhost:3307";
    var $local_username = "root";
    var $local_password = "";
    var $local_database = "geronimo";
    
    var $remote_hostname = "localhost";
    var $remote_username = "geroc620";
    var $remote_password = "dubara.81";
    var $remote_database = "geroc620_geronimo_qc";
    
    var $cloud_hostname = null;
    var $cloud_username = "root";
    var $cloud_password = "Eks9FtkkGnhDHnJy";
    var $cloud_database = "geronimo";
    var $cloud_port = null;
    var $cloud_socket = "/cloudsql/geronimo-eu:europe-west1:gerocount";

    var $conn;
    var $prefix = "";
    var $tb_account_branch = "account_branch";
    var $tb_account_company = "account_company";
    var $tb_account_contact = "account_contact";
    var $tb_account_coordinate = "account_coordinate";
    var $tb_account_file = "account_file";
    var $tb_inventory_amount = "inventory_amount";
    var $tb_inventory_file = "inventory_file";
    var $tb_inventory_item = "inventory_item";
    var $tb_inventory_package = "inventory_package";
    var $tb_inventory_quantity = "inventory_quantity";
    var $tb_parameter_entry = "parameter_entry";
    var $tb_parameter_group = "parameter_group";
    var $tb_transaction_banknote = "transaction_banknote";
    var $tb_transaction_entry = "transaction_entry";
    var $tb_transaction_file = "transaction_file";
    var $tb_transaction_item = "transaction_item";
    var $tb_transaction_journal = "transaction_journal";
    var $tb_transaction_order = "transaction_order";
    var $tb_transaction_payment = "transaction_payment";
    var $tb_transaction_perpetual = "transaction_perpetual";
    var $tb_transaction_project = "transaction_project";

    function __construct() {

        // Create connection
        if (isset($_SERVER['SERVER_NAME']) && strcmp($_SERVER['SERVER_NAME'], "geronimo-eu.appspot.com") === 0) {
            $this->conn = new mysqli($this->cloud_hostname, $this->cloud_username, $this->cloud_password, $this->cloud_database, $this->cloud_port, $this->cloud_socket);
        } else if (isset($_SERVER['SERVER_NAME']) && strcmp($_SERVER['SERVER_NAME'], "gerocount.com") === 0) {
            $this->conn = new mysqli($this->remote_hostname, $this->remote_username, $this->remote_password, $this->remote_database);
        } else if (isset($_SERVER['SERVER_NAME']) && strcmp($_SERVER['SERVER_NAME'], "localhost") === 0) {
            $this->conn = new mysqli($this->local_hostname, $this->local_username, $this->local_password, $this->local_database);
        } 

        // Check connection
        if ($this->conn == null || $this->conn->connect_errno) {
            die("Connect failed: " . $this->conn->connect_error);
        }

        // Setting character set
        $this->conn->query('SET CHARACTER SET utf8');
        $this->conn->set_charset("utf8");

        // Getting the company prefix from session variable
        //session_start();
        //print("session in construct: ");
        //print_r($_SESSION);
//        if (!isset($_SESSION["user_id"])) {
//            die("User is not logged in!");
//        }

        //if (isset($_SESSION["prefix"])) {
        //$this->prefix = $_SESSION["prefix"];
        //die("company prefix: " + $_SESSION["prefix"]);
        //} else {
        //die("company prefix is not set!");
        //}

//        // Setting the time out manually
//        ini_set('session.gc-maxlifetime', 3600);
//        if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > 3600)) {
//            // last request was more than 1 hour ago
//            session_unset();     // unset $_SESSION variable for the run-time 
//            session_destroy();   // destroy session data in storage
//        }

//        $_SESSION['LAST_ACTIVITY'] = time(); // update last activity time stamp

    }

    function close() {
        $this->conn->close();
    }

    function begin() {
        $this->conn->begin_transaction();
    }

    function commit() {
        $this->conn->commit();
    }

    function rollback() {
        $this->conn->rollback();
    }

    function query_log($query, $result) {
        if (is_object($result)) {
            //echo "Query: [$query]" . "  Result Rows: $result->num_rows<br/>";
            //error_log("Query: [$query]  Result Rows: $result->num_rows");
        } else {
            //echo "Query: [$query]<br/>";
            //error_log("Query: [$query]");
        }
    }

    function affect_log($query) {
        //echo "Query: [$query]" . "  Affected Rows: " . $this->conn->affected_rows . "<br/>";
        //error_log("Query: [$query]  Affected Rows: " . $this->conn->affected_rows);
    }

    function affect($sql) {
        $this->conn->query($sql);
        $this->affect_log($sql);
        if ($this->conn->affected_rows < 0) {
            echo "***ERROR*** <br/> affect: [$sql]<br/>";
            error_log("***ERROR*** Query: [$sql]");
        }
        if ($this->conn->insert_id > 0) {
            return $this->conn->insert_id;
        }
        return $this->conn->affected_rows;
    }

    function query($sql) {
        $result = $this->conn->query($sql);
        $this->query_log($sql, $result);
        if (!is_object($result)) {
            echo "***ERROR*** <br/> query: [$sql]<br/>";
            error_log("***ERROR*** Query: [$sql]");
        }
        return $result;
    }

    function selectStatement($db, $params) {
        // Selects
        $sql = "SELECT ";
        if (is_array($params["select"]) && count($params["select"]) > 0) {
            foreach ($params["select"] as $val) {
                $sql .= $val . ", ";
            }
            $sql = substr($sql, 0, strlen($sql) - 2);
        } else {
            $sql .= "*";
        }
        // Tables
        $tables = " FROM ";
        if (is_array($params["table"]) && count($params["table"]) > 0) {
            foreach ($params["table"] as $val) {
                $tables .= $val . ", ";
            }
            $tables = substr($tables, 0, strlen($tables) - 2);
        }
        $sql .= $tables;
        // Condition
        if (array_key_exists("condition", $params) && is_array($params["condition"]) && count($params["condition"]) > 0) {
            $sql .= " WHERE 1 = 1";
            foreach ($params["condition"] as $val) {
                $sql .= " AND " . $val;
            }
        }
        // Grouping
        if (array_key_exists("group", $params) && is_array($params["group"]) && count($params["group"]) > 0) {
            $sql .= " GROUP BY ";
            foreach ($params["group"] as $val) {
                $sql .= $val . ", ";
            }
            $sql = substr($sql, 0, strlen($sql) - 2);
            if (array_key_exists("having", $params) && is_array($params["having"]) && count($params["having"]) > 0) {
                $sql .= " HAVING ";
                foreach ($params["having"] as $val) {
                    $sql .= $val . " AND ";
                }
                $sql = substr($sql, 0, strlen($sql) - 5);
            }
        }
        // Sorting
        if (array_key_exists("order", $params) && is_array($params["order"]) && count($params["order"]) > 0) {
            $sql .= " ORDER BY ";
            foreach ($params["order"] as $val) {
                $sql .= $val . ", ";
            }
            $sql = substr($sql, 0, strlen($sql) - 2);
        }
        // Limits
        if (array_key_exists("limit", $params) && is_array($params["limit"]) && count($params["limit"]) > 0) {
            $sql .= " LIMIT ";
            foreach ($params["limit"] as $val) {
                $sql .= $val . ", ";
            }
            $sql = substr($sql, 0, strlen($sql) - 2);
        }
        return $sql;
    }

    function insertStatement($db, $params) {
        // Table
        $sql = "INSERT INTO ";
        if (is_array($params["table"]) && count($params["table"]) > 0) {
            foreach ($params["table"] as $val) {
                $sql .= $val;
            }
        }
        // Fields
        $sql .= " (";
        if (is_array($params["field"]) && count($params["field"]) > 0) {
            foreach ($params["field"] as $val) {
                $sql .= $val . ",";
            }
            $sql = substr($sql, 0, strlen($sql) - 1);
        }
        $sql .= ") VALUES (";
        // Values
        if (is_array($params["value"]) && count($params["value"]) > 0) {
            foreach ($params["value"] as $val) {
                $sql .= "'" . addslashes($val) . "',";
            }
            $sql = substr($sql, 0, strlen($sql) - 1);
            $sql .= ")";
        }
        return $sql;
    }

    function updateStatement($db, $params) {
        // Tables
        $sql = "UPDATE ";
        if (is_array($params["table"]) && count($params["table"]) > 0) {
            foreach ($params["table"] as $val) {
                $sql .= $val . ",";
            }
            $sql = substr($sql, 0, strlen($sql) - 1);
        }
        // Set fields
        $sql .= " SET ";
        if (is_array($params["field"]) && count($params["field"]) > 0) {
            foreach ($params["field"] as $val) {
                $sql .= $val . ",";
            }
            $sql = substr($sql, 0, strlen($sql) - 1);
        }
        // Condition
        if (is_array($params["condition"]) && count($params["condition"]) > 0) {
            $sql .= " WHERE 1 = 1";
            foreach ($params["condition"] as $val) {
                $sql .= " AND " . $val;
            }
        }
        return $sql;
    }

    function deleteStatement($db, $params) {
        // Tables
        $sql = "DELETE FROM ";
        if (is_array($params["table"]) && count($params["table"]) > 0) {
            foreach ($params["table"] as $val) {
                $sql .= $val . ",";
            }
            $sql = substr($sql, 0, strlen($sql) - 1);
        }
        // Condition
        if (is_array($params["condition"]) && count($params["condition"]) > 0) {
            $sql .= " WHERE 1 = 1";
            foreach ($params["condition"] as $val) {
                $sql .= " AND " . $val;
            }
        }
        return $sql;
    }

}
