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
        $item_id = $params["value"][0];
        $date_from = "";
        $date_till = "";
        $currency_id = "0";
        if (count($params["value"]) > 1) {
            $date_from = $params["value"][1];
        }
        if (count($params["value"]) > 2) {
            $date_till = $params["value"][2];
        }
        if (count($params["value"]) > 3) {
            $currency_id = $params["value"][3];
        }// else {
        //    $currency_id = $parameters["407003"]["value"];
        //}
//        $currency_rate = 1.0;
//        if (array_key_exists($currency_id, $parameters)) {
//            $currency_rate = (double) $parameters[$currency_id]["value"];
//        }
        // Querying the database
        // Transaction journal main info
        $sql = "SELECT o.date date, o.type_id type_id, o.number number, c.name company, t.quantity quantity, t.price price, t.nettotal nettotal, o.currency_id currency_id, o.currency_rate currency_rate";
        $sql .= " FROM " . $comp_code . "transaction_order o, " . $comp_code . "transaction_entry t, " . $comp_code . "account_company c";
        $sql .= " WHERE o.id = t.order_id AND o.company_id = c.id";
        if (((integer) $item_id) > 0) {
            $sql .= " AND t.item_id = " . $item_id;
        }
        if (((integer) $currency_id) > 0) {
            $sql .= " AND o.currency_id = '" . $currency_id . "'";
        }
        if (strlen($date_from) > 0) {
            $sql .= " AND o.date >= '" . $date_from . "'";
        }
        if (strlen($date_till) > 0) {
            $sql .= " AND o.date <= '" . $date_till . "'";
        }
        $sql .= " ORDER BY o.currency_id, o.date, o.number";
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
            //die("Item ID does not exists!");
        }
        //print_r($entries);
        //echo "</br>count: " . count($order) . "</br></br>";
        //
        // Item info
        $sql = "SELECT * FROM " . $comp_code . "inventory_item WHERE id = " . $item_id;
        $result4 = $db->query($sql);
        $item = $result4->fetch_array(MYSQLI_ASSOC);

        // Title
        $title = "";
        if (array_key_exists("300090", $parameters)) {
            $title = $parameters["300090"]["value"];
        }
        $this->SetFont($fontName, 'B', 16); // 'B', 'I', 'U'
        $this->Cell(40, 0, $title, 0, 0, 'L'); // 'L', 'C', 'R'
        $this->Ln(10);

        // Item info        
        $this->SetFont($fontName, 'B', $s);
        $this->Cell(100, $h, $parameters["300099"]["value"], 0, 0, 'L');
        if (strlen($date_from) > 0 || strlen($date_till) > 0) {
            $this->Cell(40, $h, $parameters["400072"]["value"], 0, 0, 'L');
        }
        $this->Ln();
        $this->SetFont($fontName, '', $s);
        $this->Cell(100, $h, $item["code"], 0, 0, 'L');
        if (strlen($date_from) > 0) {
            $this->Cell(40, $h, $parameters["300100"]["value"], 0, 0, 'L');
            $this->Cell(40, $h, date("d/m/Y", strtotime($date_from)), 0, 0, 'L');
        }
        $this->Ln();
        $this->Cell(100, $h, $item["name"], 0, 0, 'L');
        if (strlen($date_till) > 0) {
            $this->Cell(40, $h, $parameters["300101"]["value"], 0, 0, 'L');
            $this->Cell(40, $h, date("d/m/Y", strtotime($date_till)), 0, 0, 'L');
            $this->Ln();
        }
        $this->Ln();

        // Iterating over result entries
        $fill = false;
        $total_quantity = 0;
        $total_amount = 0;
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
                    $this->Cell(50, $h, $label_total . " (" . $parameters["300095"]["value"]
                            . ": " . number_format($total_quantity, 0, ".", " ") . ")", 0, 0, 'R');
                    $this->Cell(30, $h, $parameters[$currency_id]["name"] . " "
                            . number_format($total_amount, 2, ".", " "), 0, 0, 'R');
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
                $header = array($parameters["300091"]["value"], $parameters["300092"]["value"],
                    $parameters["300093"]["value"], $parameters["300094"]["value"],
                    $parameters["300095"]["value"], $parameters["300096"]["value"],
                    $parameters[$currency_id]["name"] . " " . $parameters["300097"]["value"]);
                $w = array(20, 30, 15, 50, 15, 20, 30);
                $a = array('C', 'L', 'C', 'L', 'C', 'R', 'R');

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
                $total_quantity = 0;
                $total_amount = 0;
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
            if ($row["type_id"] > 0 && array_key_exists($row["type_id"], $parameters)) {
                $this->Cell($w[1], $h, $parameters[$row["type_id"]]["name"], 0, 0, $a[1], $fill);
            } else {
                $this->Cell($w[1], $h, "", 0, 0, $a[1], $fill);
            }
            $sign = 1;
            if ($row["type_id"] == '401002' || $row["type_id"] == '401015' || $row["type_id"] == '401016') {
                $sign = -1;
            }
            // Number
            $this->Cell($w[2], $h, $row["number"], 0, 0, $a[2], $fill);
            // Company
            $this->Cell($w[3], $h, $row["company"], 0, 0, $a[3], $fill);
            // Quantity
            $quantity = (double) number_format($row["quantity"], 2, ".", "");
            $quantity *= $sign;
            $this->Cell($w[4], $h, $quantity, 0, 0, $a[4], $fill);
            // Price
            $price = (double) number_format($row["price"], 2, ".", "");
            $price *= $sign;
            if ($price != 0.0) {
                $this->Cell($w[5], $h, number_format($price, 2, ".", " "), 0, 0, $a[5], $fill);
            } else {
                $this->Cell($w[5], $h, "", 0, 0, $a[4], $fill);
            }
            // Amount
            $amount = $quantity * $price;
            $amount *= $sign;
//            if ($currency_rate != 0.0) {
//                $rate = 1.0;
//                if (array_key_exists($row["currency_id"], $parameters)) {
//                    $rate = (double) $row["currency_rate"];
//                    if ($rate === 0.0) {
//                        $rate = (double) $parameters[$row["currency_id"]]["value"];
//                    }
//                    if ($rate != 0.0) {
//                        $amount = $amount / $rate * $currency_rate;
//                    }
//                }
//            }
            $total_quantity += $quantity;
            $total_amount += $amount;
            $this->Cell($w[6], $h, number_format($total_amount, 2, ".", " "), 0, 0, $a[6], $fill);
            $this->Ln();

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
            $this->Cell(50, $h, $label_total . " (" . $parameters["300095"]["value"]
                            . ": " . number_format($total_quantity, 0, ".", " ") . ")", 0, 0, 'R');
            $this->Cell(30, $h, $parameters[$currency_id]["name"] . " "
                            . number_format($total_amount, 2, ".", " "), 0, 0, 'R');
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
            $this->Cell(60, $h, $parameters["300024"]["value"], 0, 0, 'L');
            $this->Ln();
            $this->SetFont($fontName, '', $s);
            $this->Write($h, $order["note"]);
        }

        // Page footer
        // Position at 1.5 cm from bottom
        $this->SetY(-25);
        // Font 8
        $this->SetFont($fontName, '', 8);
        // Footer note
        if (strlen($parameters["400071"]["value"]) > 0) {
            $this->Write(0, $parameters["400071"]["value"]);
            //$this->Ln();
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
