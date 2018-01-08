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
        $sql = "SELECT * FROM " . $comp_code . "parameter_entry"; //WHERE group_id LIKE '4%'";
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

        // Parameters
        $company_id = $params["value"][0];
        $date_from = "";
        $date_till = "";
        $currency_id = "0";
        $ledger_id = "0";
        if (count($params["value"]) > 1) {
            $date_from = $params["value"][1];
        }
        if (count($params["value"]) > 2) {
            $date_till = $params["value"][2];
        }
        if (count($params["value"]) > 4) {
            $ledger_id = $params["value"][4];
        }
        if (count($params["value"]) > 3) {
            $currency_id = $params["value"][3];
        }// else {
        //    $currency_id = $parameters["407003"]["value"];
        //}        
        //$currency_rate = 1.0;
        //if (array_key_exists($currency_id, $parameters)) {
        //    $currency_rate = (double) $parameters[$currency_id]["value"];
        //}
        // Querying the database
        // Transaction journal main info        
        $sql = "SELECT * FROM " . $comp_code . "transaction_journal WHERE 1 = 1";
        if (((integer) $company_id) > 0) {
            $sql .= " AND company_id = '" . $company_id . "'";
        }
        if (((integer) $ledger_id) > 0) {
            $sql .= " AND ledger_id = '" . $ledger_id . "'";
        }
        if (((integer) $currency_id) > 0) {
            $sql .= " AND currency_id = '" . $currency_id . "'";
        }
        if (strlen($date_from) > 0) {
            $sql .= " AND date >= '" . $date_from . "'";
        }
        if (strlen($date_till) > 0) {
            $sql .= " AND date <= '" . $date_till . "'";
        }
        $sql .= " ORDER BY currency_id, date";
        //echo "$sql;</br>";
        $result1 = $db->query($sql);
        //print_r($result1);
        $entries = array();
        if (is_object($result1)) {
            while ($row = $result1->fetch_array(MYSQLI_ASSOC)) {
                array_push($entries, $row);
            }
        }
        if (count($entries) <= 0) {
            //die("Company ID does not exists!");
        }
        //print_r($entries);
        //echo "</br>count: " . count($order) . "</br></br>";
        //
        // Recipient info
        $sql = "SELECT * FROM " . $comp_code . "account_company WHERE id = " . $company_id;
        $result4 = $db->query($sql);
        $company = $result4->fetch_array(MYSQLI_ASSOC);
        $sql = "SELECT * FROM " . $comp_code . "account_contact WHERE company_id = " . $company_id;
        $result5 = $db->query($sql);
        $contact = $result5->fetch_array(MYSQLI_ASSOC);
        $sql = "SELECT * FROM " . $comp_code . "account_branch, " . $comp_code . "parameter_entry pe WHERE company_id = " . $company_id . " AND country_id = pe.id";
        $result6 = $db->query($sql);
        $branch = $result6->fetch_array(MYSQLI_ASSOC);
        $sql = "SELECT * FROM " . $comp_code . "account_coordinate WHERE company_id = " . $company_id;
        $result7 = $db->query($sql);
        $coordinates = array();
        $phone = "";
        $mobile = "";
        $email = "";
        while ($row = $result7->fetch_array(MYSQLI_ASSOC)) {
            $coordinates[$row["type_id"]] = $row;
            if ($row["type_id"] == 208001) {
                $phone = $row["name"];
            }
            if ($row["type_id"] == 208002) {
                $mobile = $row["name"];
            }
            if ($row["type_id"] == 208004) {
                $email = $row["name"];
            }
        }

        // Title
        $title = "";
        if (array_key_exists("400090", $parameters)) {
            $title = $parameters["400090"]["value"];
        }
        $this->SetFont($fontName, 'B', 16); // 'B', 'I', 'U'
        $this->Cell(40, 0, $title, 0, 0, 'L'); // 'L', 'C', 'R'
        $this->Ln(10);

        // Recipient info        
        $this->SetFont($fontName, 'B', $s);
        $this->Cell(100, $h, $parameters["400099"]["value"], 0, 0, 'L');
        if (strlen($date_from) > 0 || strlen($date_till) > 0) {
            $this->Cell(40, $h, $parameters["400072"]["value"], 0, 0, 'L');
        }
        $this->Ln();
        $this->SetFont($fontName, '', $s);
        if (strlen($company["name"])) {
            $this->Cell(100, $h, $company["name"], 0, 0, 'L');
        } else {
            $this->Cell(100, $h, iconv('UTF-8', 'windows-1252', $parameters[$ledger_id]["code"] . " - " . $parameters[$ledger_id]["name"]), 0, 0, 'L');
        }
        if (strlen($date_from) > 0) {
            $this->Cell(40, $h, $parameters["400100"]["value"], 0, 0, 'L');
            $this->Cell(40, $h, date("d/m/Y", strtotime($date_from)), 0, 0, 'L');
        }
        $this->Ln();
        $address_header = explode("\n", $company["note"]);
        if (strlen($branch["address"]) > 0) {
            $this->Cell(100, $h, $branch["address"], 0, 0, 'L');
            $this->Ln();
        } else if (is_array($address_header) && count($address_header) > 0) {
            $this->Cell(100, $h, $address_header[0], 0, 0, 'L');
            $this->Ln();
        }
        if (strlen($branch["city"]) > 0) {
            $this->Cell(100, $h, $branch["city"] . ", " . $branch["name"], 0, 0, 'L');
        } else if (is_array($address_header) && count($address_header) > 1) {
            $this->Cell(100, $h, $address_header[1], 0, 0, 'L');
        } else {
            $this->Cell(100, $h, $branch["name"], 0, 0, 'L');
        } 
        $this->Ln();
        if (strlen($phone) > 0) {
            $this->Cell(100, $h, $phone, 0, 0, 'L');
        } else if (is_array($address_header) && count($address_header) > 2) {
            $this->Cell(100, $h, $address_header[2], 0, 0, 'L');
        }
        if (is_array($address_header) && count($address_header) > 3) {
            $this->Ln();
            $this->Cell(100, $h, $address_header[3], 0, 0, 'L');
        }
        
        // Iterating over result entries
        $fill = false;
        $total = 0;
        $currency_id = "0";
        $current_currency_id = "0";
        $label_total = $parameters["300098"]["value"];
        //print_r($entries);
        foreach ($entries as $row) {

            // Check if currency is still the same
            $current_currency_id = $row["currency_id"];
            //error_log("Test00: [$currency_id] [$current_currency_id] ". $row["currency_id"]);
            if (((integer) $currency_id) !== ((integer) $current_currency_id)) {

                //error_log("Test01: [$currency_id] [$current_currency_id]");
                if (((integer) $currency_id) > 0) {
                    // Closing line
                    $this->SetLineWidth(.2);
                    $this->Cell(array_sum($w), $h, '', 'T');
                    $this->Ln(1);

                    // Closing line
                    $this->SetLineWidth(.4);
                    $this->Ln(1);
                    $this->Cell(60, $h);
                    $this->Cell(120, $h, '', 'T');
                    $this->Ln(1);

                    // Final line
                    $this->SetFont($fontName, 'B', $s);
                    $this->Cell(100, $h);
                    $this->Cell(50, $h, $label_total, 0, 0, 'R');
                    $this->Cell(30, $h, $parameters[$currency_id]["name"]
                            . " " . number_format($total, 2, ".", " "), 0, 0, 'R');
                    $this->Ln();

                    // Letters
                    $this->SetFont($fontName, '', $s - 1);
                    $numFormat = new NumberFormatter($lang_code, NumberFormatter::SPELLOUT);
                    $this->Cell(180, $h, $parameters[$currency_id]["name"] . " " . $numFormat->format(number_format(abs($total), 2, ".", "")), 0, 0, 'R');
                    $this->Ln();

                    // Closing line
                    $this->SetLineWidth(.4);
                    $this->Ln(1);
                    $this->Cell(60, $h);
                    $this->Cell(120, $h, '', 'T');
                    $this->Ln(1);
                }

                // Updating currency ID
                $currency_id = $current_currency_id;

                // Table column header
                $this->Ln();
                $this->Ln();
                $header = array($parameters["400091"]["value"], $parameters["400092"]["value"],
                    $parameters["400093"]["value"], $parameters["400094"]["value"],
                    $parameters["400095"]["value"], $parameters["400096"]["value"],
                    $parameters[$currency_id]["name"] . " " . $parameters["400097"]["value"]);
                $w = array(20, 40, 25, 15, 25, 25, 30);
                $a = array('C', 'L', 'C', 'C', 'R', 'R', 'R');
                $label_total = $parameters["400098"]["value"];

                // Data loading
                //$data = $this->loadData('countries.txt');
                // Color and font of table header
                $this->SetFillColor(100, 100, 100);
                $this->SetTextColor(255);
                $this->SetLineWidth(.2);
                $this->SetFont($fontName, 'B', $s);
                // Header
                for ($i = 0; $i < count($header); $i++) {
                    $this->Cell($w[$i], $h, $header[$i], 'TB', 0, $a[$i], true);
                }
                $this->Ln();
                // Color and font of table entries
                $this->SetFillColor(230, 230, 230);
                $this->SetTextColor(0);
                $this->SetFont($fontName, '', $s);

                // Reset total amounts
                $fill = false;
                $total = 0;
            }

            //error_log("Test02: [$currency_id] [$current_currency_id]"); 
            // Checking if currency ID is not 0
            if ((integer) $currency_id === 0) {
                break;
            }

            //for ($i = 0; $i < $n; $i++) {
            //$this->Cell($w[$i], $h, $row[$i], 0, 0, $a[$i], $fill);
            //}
            //print_r($row);
            // Date
            $this->Cell($w[0], $h, date("d/m/Y", strtotime($row["date"])), 0, 0, $a[0], $fill);
            // Type
            $type_text = "";
            if ($row["type_id"] > 0 && array_key_exists($row["type_id"], $parameters)) {
                $type_text = iconv('UTF-8', 'windows-1252', $parameters[$row["type_id"]]["name"]);
            }
            // Note
            if (isset($row["note"]) && strlen(trim($row["note"])) > 0) {
                $type_text .= " - " . iconv('UTF-8', 'windows-1252', trim($row["note"]));
            }
            //$this->Cell($w[1], $h, $type_text, 0, 0, $a[1], $fill);
            $row_h = $this->getNumLines($type_text, $w[1]);
            $this->MultiCell($w[1], $h, $type_text, 0, $a[1], $fill, 0, '', '', true, 0, false, true, 0, 'T', false);
            // Number
            $this->Cell($w[2], $h, $row["number"], 0, 0, $a[2], $fill);
            // Currency
            if ($row["currency_id"] > 0 && array_key_exists($row["currency_id"], $parameters)) {
                $this->Cell($w[3], $h, $parameters[$row["currency_id"]]["name"], 0, 0, $a[3], $fill);
            } else {
                $this->Cell($w[3], $h, "", 0, 0, $a[3], $fill);
            }
            // debit
            $debit = (double) number_format($row["debit"], 2, ".", "");
            if ($debit != 0.0) {
                $this->Cell($w[4], $h, number_format($debit, 2, ".", " "), 0, 0, $a[4], $fill);
            } else {
                $this->Cell($w[4], $h, "", 0, 0, $a[4], $fill);
            }
            // Credit
            $credit = (double) number_format($row["credit"], 2, ".", "");
            if ($credit != 0.0) {
                $this->Cell($w[5], $h, number_format($credit, 2, ".", " "), 0, 0, $a[5], $fill);
            } else {
                $this->Cell($w[5], $h, "", 0, 0, $a[5], $fill);
            }
            $amount = $debit - $credit;
            $total += $amount;
            $this->Cell($w[6], $h, number_format($total, 2, ".", " "), 0, 0, $a[6], $fill);
            $this->Ln($h * $row_h);
            // Background
            $fill = !$fill;
        }

        // Printing last total amounts
        if (((integer) $currency_id) > 0) {
            // Closing line
            $this->SetLineWidth(.2);
            $this->Cell(array_sum($w), $h, '', 'T');
            $this->Ln(1);

            // Closing line
            $this->SetLineWidth(.4);
            $this->Ln(1);
            $this->Cell(60, $h);
            $this->Cell(120, $h, '', 'T');
            $this->Ln(1);

            // Final line
            $this->SetFont($fontName, 'B', $s);
            $this->Cell(100, $h);
            $this->Cell(50, $h, $label_total, 0, 0, 'R');
            $this->Cell(30, $h, $parameters[$currency_id]["name"]
                    . " " . number_format($total, 2, ".", " "), 0, 0, 'R');
            $this->Ln();

            // Letters
            $this->SetFont($fontName, '', $s - 1);
            $numFormat = new NumberFormatter($lang_code, NumberFormatter::SPELLOUT);
            $this->Cell(180, $h, $parameters[$currency_id]["name"] . " " . $numFormat->format(number_format(abs($total), 2, ".", "")), 0, 0, 'R');
            $this->Ln();

            // Closing line
            $this->SetLineWidth(.4);
            $this->Ln(1);
            $this->Cell(60, $h);
            $this->Cell(120, $h, '', 'T');
            $this->Ln(1);
        }

        // Note
        if (isset($order["note"]) && strlen(trim($order["note"])) > 0) {
            $this->SetFont($fontName, 'B', $s);
            $this->Cell(60, $h, $parameters["400024"]["value"], 0, 0, 'L');
            $this->Ln();
            $this->SetFont($fontName, '', $s);
            $this->Write($h, $order["note"]);
        }

        // Page footer
        // Position at 1.5 cm from bottom
        $this->SetY(-25);        
        // Footer note
        if (strlen($parameters["400071"]["value"]) > 0) {
            $this->SetFont($fontName, '', 8);
            $this->Write(0, $parameters["400071"]["value"]);
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
