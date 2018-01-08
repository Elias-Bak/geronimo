<?php

class Tools {

    static function arrayToString($arr) {
        if ($arr == NULL || $arr == "") {
            return '';
        }
        $result = "";
        foreach ($arr as $a) {
            $result .= $a . " ";
        }
        return $result;
    }

    static function format_date_for_sql($date) {
        if ($date == "") {
            return "NULL";
        } else {
            $dateParts = date_parse($date);
            return $dateParts["year"] * 10000 + $dateParts["month"] * 100 + $dateParts["day"];
        }
    }

    static function getParams(&$isBase64) {
        if (isset($_GET["params"]) && $_GET["params"] != "") {
            $data = $_GET["params"];
        } else {
            $data = file_get_contents("php://input");
        }
        if (substr($data, 0, 1) !== "{") {
            $isBase64 = true;
            $data = base64_decode($data);
        }
        //error_log("data params: [$data]");
        $params = json_decode($data, true);
        if (count($params) === 0) {
            die("HTTP request data does not exist!");
        }
        return $params;
    }

    static function getParamLocale($data, $lang_code) {
        if ($lang_code == NULL || $lang_code == "") {
            $lang_code = "en";
        }
        if ($data != null && substr($data, 0, 1) === "{") {
            $data = json_decode($data, true);
            if (array_key_exists($lang_code, $data)) {
                $data = $data[$lang_code];
            }
        }
        return $data;
    }

    static function isBase64($data) {
        if (substr($data, 0, 1) !== "{") {
            return true;
        }
        return false;
    }

    static function getOutput($data, $isBase64) {
        $data = json_encode($data, JSON_HEX_TAG | JSON_HEX_APOS);
        if ($isBase64) {
            $data = base64_encode($data);
        }
        return $data;
    }

    static function convertNumberToWord($num = false) {
        $num = str_replace(array(',', ' '), '', trim($num));
        if (!$num) {
            return false;
        }
        $num = (int) $num;
        $words = array();
        $list1 = array('', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
            'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
        );
        $list2 = array('', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred');
        $list3 = array('', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion',
            'octillion', 'nonillion', 'decillion', 'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion',
            'quindecillion', 'sexdecillion', 'septendecillion', 'octodecillion', 'novemdecillion', 'vigintillion'
        );
        $num_length = strlen($num);
        $levels = (int) (($num_length + 2) / 3);
        $max_length = $levels * 3;
        $num = substr('00' . $num, -$max_length);
        $num_levels = str_split($num, 3);
        for ($i = 0; $i < count($num_levels); $i++) {
            $levels--;
            $hundreds = (int) ($num_levels[$i] / 100);
            $hundreds = ($hundreds ? ' ' . $list1[$hundreds] . ' hundred' . ( $hundreds == 1 ? '' : 's' ) . ' ' : '');
            $tens = (int) ($num_levels[$i] % 100);
            $singles = '';
            if ($tens < 20) {
                $tens = ($tens ? ' ' . $list1[$tens] . ' ' : '' );
            } else {
                $tens = (int) ($tens / 10);
                $tens = ' ' . $list2[$tens] . ' ';
                $singles = (int) ($num_levels[$i] % 10);
                $singles = ' ' . $list1[$singles] . ' ';
            }
            $words[] = $hundreds . $tens . $singles . ( ( $levels && (int) ( $num_levels[$i] ) ) ? ' ' . $list3[$levels] . ' ' : '' );
        } //end for loop
        $commas = count($words);
        if ($commas > 1) {
            $commas = $commas - 1;
        }
        return implode(' ', $words);
    }

}

//simple class to convert number to words in php based on http://www.karlrixon.co.uk/writing/convert-numbers-to-words-with-php/
if (!class_exists('NumbersToWords')) {

    /**
     * NumbersToWords
     */
    class NumbersToWords {

        public static $hyphen = '-';
        public static $conjunction = ' and ';
        public static $separator = ', ';
        public static $negative = 'negative ';
        public static $decimal = ' point ';
        public static $dictionary = array(
            0 => 'zero',
            1 => 'one',
            2 => 'two',
            3 => 'three',
            4 => 'four',
            5 => 'five',
            6 => 'six',
            7 => 'seven',
            8 => 'eight',
            9 => 'nine',
            10 => 'ten',
            11 => 'eleven',
            12 => 'twelve',
            13 => 'thirteen',
            14 => 'fourteen',
            15 => 'fifteen',
            16 => 'sixteen',
            17 => 'seventeen',
            18 => 'eighteen',
            19 => 'nineteen',
            20 => 'twenty',
            30 => 'thirty',
            40 => 'fourty',
            50 => 'fifty',
            60 => 'sixty',
            70 => 'seventy',
            80 => 'eighty',
            90 => 'ninety',
            100 => 'hundred',
            1000 => 'thousand',
            1000000 => 'million',
            1000000000 => 'billion',
            1000000000000 => 'trillion',
            1000000000000000 => 'quadrillion',
            1000000000000000000 => 'quintillion'
        );

        public static function convert($number) {
            if (!is_numeric($number))
                return false;
            $string = '';
            switch (true) {
                case $number < 21:
                    $string = self::$dictionary[$number];
                    break;
                case $number < 100:
                    $tens = ((int) ($number / 10)) * 10;
                    $units = $number % 10;
                    $string = self::$dictionary[$tens];
                    if ($units) {
                        $string .= self::$hyphen . self::$dictionary[$units];
                    }
                    break;
                case $number < 1000:
                    $hundreds = $number / 100;
                    $remainder = $number % 100;
                    $string = self::$dictionary[$hundreds] . ' ' . self::$dictionary[100];
                    if ($remainder) {
                        $string .= self::$conjunction . self::convert($remainder);
                    }
                    break;
                default:
                    $baseUnit = pow(1000, floor(log($number, 1000)));
                    $numBaseUnits = (int) ($number / $baseUnit);
                    $remainder = $number % $baseUnit;
                    $string = self::convert($numBaseUnits) . ' ' . self::$dictionary[$baseUnit];
                    if ($remainder) {
                        $string .= $remainder < 100 ? self::$conjunction : self::$separator;
                        $string .= self::convert($remainder);
                    }
                    break;
            }
            return $string;
        }

    }

    //end class
}//end if
/**
 * usage:
 */
//echo NumbersToWords::convert(2839);

