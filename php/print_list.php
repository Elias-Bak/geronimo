<?php

// Connecting to databse using helper package
// Importing the FPDF library tool file
//require_once('fpdf17/fpdf.php');
//require_once('fpdf17/mem_image.php');
require_once('tcpdf62/tcpdf.php');

// Class that extends FPDF package and generates the output PDF file
class PDF extends TCPDF {

    // Load data
    function loadData($file) {
        // Read file lines
        $lines = file($file);
        $data = array();
        foreach ($lines as $line)
            $data[] = explode(';', trim($line));
        return $data;
    }

    // Page header
    function Header() {
        // Logo
        //$this->Image('logo.png', 15, 10, 180); // X, Y, Width, Height
        //$this->Ln(40);
    }

    // Page footer
    function Footer() {
        // Position at 1.5 cm from bottom
        $this->SetY(-15);
        // Font 8
        $this->SetFont('pdfahelvetica', '', 8);
//        // Footer note
//        $this->Write(0, '');
//        $this->Ln();
        // Page number
        $this->Cell(0, 10, date("d.m.Y") . ' - page ' . $this->PageNo() . '/' . $this->getAliasNbPages(), 0, 0, 'C');
    }

    // Generate form
    function Generate($db, $params) {

        // Settings
        $h = 5;
        $s = 9;
        $fontName = 'dejavusans';
        
        $id = $params["id"];
        $title = $params["title"];
        $header = $params["header"];
        $query = $params["query"];
        $totals = $params["totals"];
        $totals_desc = $params["desc"];
        
        // Company code prefix
        $comp_code = "";
        if (array_key_exists("code", $params) && strlen($params["code"]) > 0) {
            $comp_code = $params["code"];
        }
        
        // Language code
        $lang_code = "";
        if (array_key_exists("language", $params) && strlen($params["language"]) > 0) {
            $lang_code = $params["language"];
            if ($lang_code === 'ar' || $lang_code === 'iw') {
                $this->setRTL(true);
            }
        }
        
        // Parameters info
        $sql = "SELECT * FROM " . $comp_code . "parameter_entry WHERE group_id = 104";
        //echo "$sql;</br>";
        $result3 = $db->query($sql);
        //print_r($result3);
        $parameters = array();
        if (is_object($result3)) {
            while ($row = $result3->fetch_array(MYSQLI_ASSOC)) {
                $parameters[$row["id"]] = $row;
                $parameters[$row["id"]]["value"] = Tools::getParamLocale($parameters[$row["id"]]["value"], $lang_code);
                $parameters[$row["id"]]["description"] = Tools::getParamLocale($parameters[$row["id"]]["description"], $lang_code);
            }
        }
        //print_r($parameters);
        //echo "</br>count: " . count($parameters) . "</br></br>";

        // Logo
        try {
            if (array_key_exists("104007", $parameters)) {
                if ($parameters["104007"]["file"] !== null && strlen($parameters["104007"]["file"]) > 100) {
                    $this->Image('@' . base64_decode($parameters["104007"]["file"]), $parameters["104003"]["value"], $parameters["104001"]["value"], $parameters["104005"]["value"]); // X, Y, Width, Height
                    if (array_key_exists("104008", $parameters)) {
                        $this->Ln((integer) $parameters["104008"]["value"]);
                    } else {
                        $this->Ln(40);
                    }
                } else {
                    if ($parameters["104007"]["description"] !== 'null' && strlen($parameters["104007"]["description"]) > 0) {
                        $this->SetFont($fontName, 'B', 14); // 'B', 'I', 'U'
                        $this->Cell(180, 0, $parameters["104007"]["description"], 0, 0, 'L');
                        $this->Ln(10);
                    }
                    if ($parameters["104007"]["note"] !== 'null' && strlen($parameters["104007"]["note"]) > 0) {
                        $this->SetFont($fontName, '', 11); // 'B', 'I', 'U'
                        $this->Cell(180, 0, $parameters["104007"]["note"], 0, 0, 'L');
                        $this->Ln(20);
                    }
                }
            }
        } catch (Exception $e) {
            
        }

        // Margins
        if (array_key_exists("104001", $parameters)) {
            $this->SetTopMargin((integer) $parameters["104001"]["value"]);
            $this->Ln((integer) $parameters["104001"]["value"]);
        } else {
            $this->SetTopMargin(20);
            $this->Ln(20);
        }
        if (array_key_exists("104003", $parameters)) {
            $this->SetLeftMargin((integer) $parameters["104003"]["value"]);
        } else {
            $this->SetLeftMargin(15);
        }
        if (array_key_exists("104004", $parameters)) {
            $this->SetRightMargin((integer) $parameters["104004"]["value"]);
        } else {
            $this->SetRightMargin(15);
        }

        // Title
        $this->SetFont($fontName, 'B', 16); // 'B', 'I', 'U'
        if (strlen($title)) {
            $this->Cell(100, 0, $title, 0, 0, 'L'); // 'L', 'C', 'R'
        } else {
            $this->Cell(100, 0, iconv('UTF-8', 'windows-1252', $title), 0, 0, 'L'); // 'L', 'C', 'R'
        }
        $this->Ln(10);
        //$this->Ln();
        // Table column header (total = 180)
        if ($id === 500001) {
            $w = array(20, 30, 20, 70, 25, 15);
            $a = array('C', 'L', 'C', 'L', 'R', 'C');
        } else if ($id === 500002) {
            $w = array(20, 35, 15, 60, 35, 15);
            $a = array('C', 'C', 'C', 'L', 'R', 'C');
        } else if ($id === 500003) {
            $w = array(30, 90, 35, 25);
            $a = array('C', 'L', 'R', 'R');
        } else if ($id === 500004) {
            $w = array(20, 30, 15, 30, 40, 10, 20, 20);
            $a = array('C', 'C', 'C', 'L', 'L', 'C', 'R', 'R');
        } else if ($id === 500005) {
            $w = array(50, 25, 50, 20, 35);
            $a = array('L', 'C', 'L', 'C', 'R');
        } else if ($id === 500006) {
            $w = array(20, 20, 15, 30, 45, 15, 35);
            $a = array('C', 'C', 'C', 'L', 'L', 'R', 'R');
        }        

        // Color and font of table header
        $this->SetFillColor(100, 100, 100);
        $this->SetTextColor(255);
        $this->SetLineWidth(.2);
        $this->SetFont($fontName, 'B', $s);

        // Header
        //print_r($header);
        $num = count($header) - 1;
        for ($i = 0; $i < $num; $i++) {
            $this->Cell($w[$i], $h, $header[$i]["value"], 'TB', 0, $a[$i], true);
        }
        $this->Ln();

        // Color and font of table entries
        $this->SetFillColor(230, 230, 230);
        $this->SetTextColor(0);
        $this->SetFont($fontName, '', $s);

        // Table entries data
        $fill = false;
        
        // Building the query
        //print_r($query);
        $sql = $db->selectStatement($db, $query);
        //echo "SQL: [$sql]\n";

        // Executing the query
        $result = $db->query($sql);
        //print_r($result);

        $entries = array();
        if (is_object($result)) {
            while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
                array_push($entries, $row);
            }
        }
        if (count($entries) <= 0) {
            die("Result entries is empty!");
        }

        // Report entries
        if ($id === 500001) {
            // Table entries
            foreach ($entries as $row) {
                $this->Cell($w[0], $h, $row["company_code"], 0, 0, $a[0], $fill);
                $this->Cell($w[1], $h, $row["company_type"], 0, 0, $a[1], $fill);
                $this->Cell($w[2], $h, $row["company_id"], 0, 0, $a[2], $fill);
                $this->Cell($w[3], $h, $row["company_name"], 0, 0, $a[3], $fill);
                if ($row["balance"] !== "0") {
                    $this->Cell($w[4], $h, number_format($row["balance"], 0, ".", ""), 0, 0, $a[4], $fill);
                } else {
                    $this->Cell($w[4], $h, "", 0, 0, $a[4], $fill);
                }
                $this->Cell($w[5], $h, $row["currency_name"], 0, 0, $a[5], $fill);
                $this->Ln();
                $fill = !$fill;
            }
            // Total amounts
            $fill = false;
            $this->SetFont($fontName, 'B', $s);
            foreach ($totals as $currency => $entry) {
                $this->Cell($w[0], $h, "", 'TB', 0, $a[0], $fill);
                $this->Cell($w[1], $h, "", 'TB', 0, $a[1], $fill);
                $this->Cell($w[2], $h, "", 'TB', 0, $a[2], $fill);
                $this->Cell($w[3], $h, $totals_desc, 'TB', 0, $a[3], $fill);
                $this->Cell($w[4], $h, number_format($entry["balance"], 2, ".", ""), 'TB', 0, $a[4], $fill);
                $this->Cell($w[5], $h, $currency, 'TB', 0, $a[5], $fill);
                $this->Ln();
            }
        } else if ($id === 500002) {
            // Table entries
            foreach ($entries as $row) {
                $this->Cell($w[0], $h, date("d/m/Y", strtotime($row["date"])), 0, 0, $a[0], $fill);
                $this->Cell($w[1], $h, $row["type_name"], 0, 0, $a[1], $fill);
                $this->Cell($w[2], $h, $row["number"], 0, 0, $a[2], $fill);
                $this->Cell($w[3], $h, $row["company_name"] . " (" . $row["company_type"] . ")", 0, 0, $a[3], $fill);
                $this->Cell($w[4], $h, number_format($row["nettotal"], 2, ".", ""), 0, 0, $a[4], $fill);
                $this->Cell($w[5], $h, $row["currency_name"], 0, 0, $a[5], $fill);
                $this->Ln();
                $fill = !$fill;
            }
            // Total amounts
            $fill = false;
            $this->SetFont($fontName, 'B', $s);
            foreach ($totals as $type => $entry) {
                foreach ($entry as $currency => $amount) {
                    $this->Cell($w[0], $h, "", 'TB', 0, $a[0], $fill);
                    $this->Cell($w[1], $h, "", 'TB', 0, $a[1], $fill);
                    $this->Cell($w[2], $h, "", 'TB', 0, $a[2], $fill);
                    $this->Cell($w[3], $h, "$totals_desc ($type - $currency)", 'TB', 0, $a[3], $fill);
                    $this->Cell($w[4], $h, number_format($amount, 2, ".", ""), 'TB', 0, $a[4], $fill);
                    $this->Cell($w[5], $h, $currency, 'TB', 0, $a[5], $fill);
                    $this->Ln();
                }
            }
        } else if ($id === 500003) {
            // Table entries
            foreach ($entries as $row) {
                $this->Cell($w[0], $h, $row["account_code"], 0, 0, $a[0], $fill);
                $this->Cell($w[1], $h, $row["account_name"], 0, 0, $a[1], $fill);
                if ($row["balance"] !== "0") {
                    $this->Cell($w[2], $h, number_format($row["balance"], 0, ".", ""), 0, 0, $a[2], $fill);
                } else {
                    $this->Cell($w[2], $h, "", 0, 0, $a[2], $fill);
                }
                $this->Cell($w[3], $h, $row["currency_name"], 0, 0, $a[3], $fill);
                $this->Ln();
                $fill = !$fill;
            }
            // Total amounts
            $fill = false;
            $this->SetFont($fontName, 'B', $s);
            foreach ($totals as $currency => $entry) {
                $this->Cell($w[0], $h, "", 'TB', 0, $a[0], $fill);
                $this->Cell($w[1], $h, $totals_desc, 'TB', 0, $a[1], $fill);
                $this->Cell($w[2], $h, number_format($entry["balance"], 2, ".", ""), 'TB', 0, $a[2], $fill);
                $this->Cell($w[3], $h, $currency, 'TB', 0, $a[3], $fill);
                $this->Ln();
            }
        } else if ($id === 500004) {
            // Table entries
            foreach ($entries as $row) {
                $this->Cell($w[0], $h, date("d/m/Y", strtotime($row["date"])), 0, 0, $a[0], $fill);
                $this->Cell($w[1], $h, $row["type_name"], 0, 0, $a[1], $fill);
                $this->Cell($w[2], $h, $row["number"], 0, 0, $a[2], $fill);
                $company = $row["company_name"];
                if (strlen($company) > 15) {
                    $company = substr($company, 0, 15) . "...";
                }
                $this->Cell($w[3], $h, $company, 0, 0, $a[3], $fill);
                $account = $row["account_code"] . " " . $row["account_name"];
                if (strlen($account) > 20) {
                    $account = substr($account, 0, 20) . "...";
                }
                $this->Cell($w[4], $h, $account, 0, 0, $a[4], $fill);
                $this->Cell($w[5], $h, $row["currency_name"], 0, 0, $a[5], $fill);
                $this->Cell($w[6], $h, number_format($row["debit"], 2, ".", ""), 0, 0, $a[6], $fill);
                $this->Cell($w[7], $h, number_format($row["credit"], 2, ".", ""), 0, 0, $a[7], $fill);
                $this->Ln();
                $fill = !$fill;
            }
            // Total amounts
            $fill = false;
            $this->SetFont($fontName, 'B', $s);
            foreach ($totals as $currency => $entry) {
                $this->Cell($w[0], $h, "", 'TB', 0, $a[0], $fill);
                $this->Cell($w[1], $h, "", 'TB', 0, $a[1], $fill);
                $this->Cell($w[2], $h, "", 'TB', 0, $a[2], $fill);
                $this->Cell($w[3], $h, "", 'TB', 0, $a[3], $fill);
                $this->Cell($w[4], $h, $totals_desc, 'TB', 0, $a[4], $fill);
                $this->Cell($w[5], $h, $currency, 'TB', 0, $a[5], $fill);
                $this->Cell($w[6], $h, number_format($entry["debit"], 2, ".", ""), 'TB', 0, $a[6], $fill);
                $this->Cell($w[7], $h, number_format($entry["credit"], 2, ".", ""), 'TB', 0, $a[7], $fill);
                $this->Ln();
            }
        } else if ($id === 500005) {
            // Table entries
            foreach ($entries as $row) {
                $this->Cell($w[0], $h, $row["account_code"] . ": " . $row["account_name"], 0, 0, $a[0], $fill);
                $this->Cell($w[1], $h, $row["item_code"], 0, 0, $a[1], $fill);
                $this->Cell($w[2], $h, $row["item_name"], 0, 0, $a[2], $fill);
                $this->Cell($w[3], $h, number_format($row["quantity"], 0, ".", ""), 0, 0, $a[3], $fill);
                $this->Cell($w[4], $h, $row["currency_name"] . " " . number_format($row["balance"], 2, ".", ""), 0, 0, $a[4], $fill);
                $this->Ln();
                $fill = !$fill;
            }
            // Total amounts
            $fill = false;
            $this->SetFont($fontName, 'B', $s);
            foreach ($totals as $currency => $entry) {
                $this->Cell($w[0], $h, "", 'TB', 0, $a[0], $fill);
                $this->Cell($w[1], $h, "", 'TB', 0, $a[1], $fill);
                $this->Cell($w[2], $h, $totals_desc, 'TB', 0, $a[2], $fill);
                $this->Cell($w[3], $h, number_format($entry["quantity"], 0, ".", ""), 'TB', 0, $a[3], $fill);
                $this->Cell($w[4], $h, $currency . " " . number_format($entry["balance"], 2, ".", ""), 'TB', 0, $a[4], $fill);
                $this->Ln();
            }
        } else if ($id === 500006) {
            // Table entries
            foreach ($entries as $row) {
                $this->Cell($w[0], $h, date("d/m/Y", strtotime($row["date"])), 0, 0, $a[0], $fill);
                $this->Cell($w[1], $h, $row["type_name"], 0, 0, $a[1], $fill);
                $this->Cell($w[2], $h, $row["number"], 0, 0, $a[2], $fill);
                $this->Cell($w[3], $h, $row["company_name"], 0, 0, $a[3], $fill);
                $current_y = $this->GetY();
                $current_x = $this->GetX();
                $item = $row["item_code"] . ": " . $row["item_name"];
                if (strlen($item) > 45) {
                    $item = substr($item, 0, 45) . "...";
                }
                $this->MultiCell($w[4], $h, $item, 0, $a[4], $fill);
                $this->SetXY($current_x + $w[4], $current_y);
                $this->Cell($w[5], $h, number_format($row["quantity"], 0, ".", ""), 0, 0, $a[5], $fill);
                $this->Cell($w[6], $h, $row["currency_name"] . " " . number_format($row["nettotal"], 2, ".", ""), 0, 0, $a[6], $fill);
                $this->Ln();
                $this->Ln();
                $fill = !$fill;
            }
            // Total amounts
            $fill = false;
            $this->SetFont($fontName, 'B', $s);
            foreach ($totals as $type => $entry) {
                foreach ($entry as $currency => $amount) {
                    $this->Cell($w[0], $h, "", 'TB', 0, $a[0], $fill);
                    $this->Cell($w[1], $h, "", 'TB', 0, $a[1], $fill);
                    $this->Cell($w[2], $h, "", 'TB', 0, $a[2], $fill);
                    $this->Cell($w[3] + $w[4], $h, "$totals_desc ($type - $currency)", 'TB', 0, $a[3], $fill);
                    $this->Cell($w[5], $h, number_format($amount["quantity"], 0, ".", ""), 'TB', 0, $a[5], $fill);
                    $this->Cell($w[6], $h, $currency . " " . number_format($amount["nettotal"], 2, ".", ""), 'TB', 0, $a[6], $fill);
                    $this->Ln();
                }
            }
        }
    }

}

// Parameters data
require_once("tools.php");
$params = Tools::getParams($isBase64);

// Database
require_once("database.php");
$db = new Database;

// Creating and displaying PDF output
$pdf = new PDF();
$pdf->AddPage(); // adding the first page
$pdf->Generate($db, $params); // drawing and filling the table
$pdf->Output(); // displaying output

// Closing connection
$db->close();
